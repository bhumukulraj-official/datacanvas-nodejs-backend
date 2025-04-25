/**
 * WebSocket Manager
 * 
 * Manages WebSocket connections and implements the enhanced WebSocket protocol
 * with features like message acknowledgment, compression, and offline message delivery.
 */
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const zlib = require('zlib');
const config = require('../../config');
const logger = require('../../shared/utils/logger');
const messageService = require('./services/message.service');
const connectionService = require('./services/connection.service');
const { WebSocketError } = require('../../shared/errors');
const { promisify } = require('util');

// Promisify zlib methods
const deflateAsync = promisify(zlib.deflate);
const inflateAsync = promisify(zlib.inflate);

class WebSocketManager {
  constructor(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: config.websocket.path || '/ws',
      maxPayload: config.websocket.maxPayloadSize || 1024 * 1024 // 1MB default
    });
    
    this.messageHandlers = new Map();
    this.setupDefaultHandlers();
    this.setupHeartbeat();
    
    // Track server stats
    this.stats = {
      totalConnections: 0,
      activeConnections: 0,
      messagesReceived: 0,
      messagesSent: 0,
      errors: 0,
      lastResetTime: new Date()
    };
    
    // Initialize the WebSocket server
    this.init();
  }
  
  /**
   * Initialize the WebSocket server
   */
  init() {
    this.wss.on('connection', this.handleConnection.bind(this));
    this.wss.on('error', this.handleServerError.bind(this));
    
    logger.info(`WebSocket server initialized at ${config.websocket.path || '/ws'}`);
  }
  
  /**
   * Set up default message handlers
   */
  setupDefaultHandlers() {
    this.registerMessageHandler('ping', this.handlePing.bind(this));
    this.registerMessageHandler('ack', this.handleAcknowledgment.bind(this));
    this.registerMessageHandler('compress', this.toggleCompression.bind(this));
  }
  
  /**
   * Set up heartbeat interval to detect dead connections
   */
  setupHeartbeat() {
    const interval = config.websocket.heartbeatInterval || 30000; // 30 seconds default
    
    setInterval(() => {
      this.wss.clients.forEach(ws => {
        if (ws.isAlive === false) {
          logger.debug(`Terminating inactive connection: ${ws.connectionId}`);
          return ws.terminate();
        }
        
        ws.isAlive = false;
        ws.ping();
      });
    }, interval);
  }
  
  /**
   * Register a message handler
   * 
   * @param {string} messageType - Type of message to handle
   * @param {Function} handler - Handler function
   */
  registerMessageHandler(messageType, handler) {
    this.messageHandlers.set(messageType, handler);
  }
  
  /**
   * Handle new WebSocket connection
   * 
   * @param {WebSocket} ws - WebSocket connection
   * @param {Object} req - HTTP request object
   */
  handleConnection(ws, req) {
    // Generate connection ID
    ws.connectionId = uuidv4();
    ws.isAlive = true;
    
    // Set default connection properties
    ws.useCompression = false;
    ws.requireAcks = false;
    
    // Update stats
    this.stats.totalConnections++;
    this.stats.activeConnections++;
    
    // Set up connection event handlers
    ws.on('message', (data) => this.handleClientMessage(ws, data));
    ws.on('close', () => this.handleDisconnect(ws));
    ws.on('error', (error) => this.handleClientError(ws, error));
    ws.on('pong', () => { ws.isAlive = true; });
    
    // Log connection
    logger.info(`New WebSocket connection: ${ws.connectionId}`, {
      ip: req.socket.remoteAddress,
      headers: req.headers
    });
    
    // Send welcome message
    this.sendToClient(ws, 'welcome', {
      connectionId: ws.connectionId,
      serverTime: new Date().toISOString(),
      features: {
        compression: true,
        acknowledgment: true,
        offlineMessages: true
      }
    });
  }
  
  /**
   * Authenticate WebSocket connection
   * 
   * @param {WebSocket} ws - WebSocket connection
   * @param {string} userId - User ID
   * @param {string} sessionId - Session ID
   */
  authenticateConnection(ws, userId, sessionId) {
    ws.userId = userId;
    ws.authenticated = true;
    ws.sessionId = sessionId;
    
    // Register connection with connection service
    connectionService.registerConnection(ws.connectionId, userId, {
      ip: ws._socket.remoteAddress,
      userAgent: ws.userAgent,
      sessionId
    });
    
    // Deliver any pending messages
    this.deliverPendingMessages(ws, userId);
  }
  
  /**
   * Deliver pending messages to a client
   * 
   * @param {WebSocket} ws - WebSocket connection
   * @param {string} userId - User ID
   */
  async deliverPendingMessages(ws, userId) {
    try {
      // Get pending messages for user
      const pendingMessages = messageService.getPendingMessages(userId, {
        limit: config.websocket.maxPendingMessagesPerDelivery || 10,
        onlyHighPriority: false
      });
      
      if (pendingMessages.length === 0) {
        return;
      }
      
      // Send each message
      const messageIds = [];
      for (const message of pendingMessages) {
        // Add to tracking for later cleanup
        messageIds.push(message.id);
        
        // Send to client
        this.sendToClient(ws, message.type, message.payload, {
          id: message.id,
          requireAck: message.requireAck
        });
      }
      
      // Remove delivered messages
      if (messageIds.length > 0) {
        messageService.removePendingMessages(userId, messageIds);
      }
      
      logger.debug(`Delivered ${pendingMessages.length} pending messages to user ${userId}`);
    } catch (error) {
      logger.error(`Error delivering pending messages: ${error.message}`, {
        userId,
        connectionId: ws.connectionId,
        error
      });
    }
  }
  
  /**
   * Handle client message
   * 
   * @param {WebSocket} ws - WebSocket connection
   * @param {Buffer|String} data - Message data
   */
  async handleClientMessage(ws, data) {
    try {
      this.stats.messagesReceived++;
      
      // Decompress if necessary
      let messageData = data;
      if (ws.useCompression && Buffer.isBuffer(data)) {
        try {
          messageData = await inflateAsync(data);
        } catch (error) {
          // If decompression fails, treat as uncompressed
          logger.warn(`Failed to decompress message: ${error.message}`);
        }
      }
      
      // Parse message
      let message;
      try {
        message = JSON.parse(messageData.toString());
      } catch (error) {
        return this.sendError(ws, 'Invalid message format', 'INVALID_JSON');
      }
      
      // Validate message structure
      if (!message || !message.type || typeof message.type !== 'string') {
        return this.sendError(ws, 'Invalid message structure', 'INVALID_FORMAT');
      }
      
      // Find handler for message type
      const handler = this.messageHandlers.get(message.type);
      if (!handler) {
        return this.sendError(ws, `Unsupported message type: ${message.type}`, 'UNKNOWN_TYPE');
      }
      
      // Process message with handler
      await handler(ws, message.payload || {}, message.id);
      
    } catch (error) {
      this.stats.errors++;
      logger.error(`Error handling WebSocket message: ${error.message}`, {
        connectionId: ws.connectionId,
        userId: ws.userId,
        error
      });
      this.sendError(ws, 'Server error processing message', 'SERVER_ERROR');
    }
  }
  
  /**
   * Handle client disconnect
   * 
   * @param {WebSocket} ws - WebSocket connection
   */
  handleDisconnect(ws) {
    try {
      // Update stats
      this.stats.activeConnections = Math.max(0, this.stats.activeConnections - 1);
      
      // Clean up connection from service
      if (ws.connectionId) {
        connectionService.removeConnection(ws.connectionId);
      }
      
      logger.info(`WebSocket disconnected: ${ws.connectionId}`, {
        userId: ws.userId || 'anonymous',
        duration: ws.connectedAt ? (Date.now() - ws.connectedAt) : null
      });
    } catch (error) {
      logger.error(`Error handling WebSocket disconnect: ${error.message}`, {
        connectionId: ws.connectionId,
        error
      });
    }
  }
  
  /**
   * Handle client error
   * 
   * @param {WebSocket} ws - WebSocket connection
   * @param {Error} error - Error object
   */
  handleClientError(ws, error) {
    this.stats.errors++;
    
    logger.error(`WebSocket client error: ${error.message}`, {
      connectionId: ws.connectionId,
      userId: ws.userId,
      error
    });
  }
  
  /**
   * Handle server error
   * 
   * @param {Error} error - Error object
   */
  handleServerError(error) {
    this.stats.errors++;
    
    logger.error(`WebSocket server error: ${error.message}`, { error });
  }
  
  /**
   * Handle ping message
   * 
   * @param {WebSocket} ws - WebSocket connection
   * @param {Object} payload - Message payload
   * @param {string} messageId - Message ID for acknowledgement
   */
  async handlePing(ws, payload, messageId) {
    this.sendToClient(ws, 'pong', {
      serverTime: new Date().toISOString(),
      echo: payload
    }, { id: messageId });
  }
  
  /**
   * Handle acknowledgment message
   * 
   * @param {WebSocket} ws - WebSocket connection
   * @param {Object} payload - Message payload
   */
  async handleAcknowledgment(ws, payload) {
    if (!payload.messageId) {
      return this.sendError(ws, 'Missing messageId in acknowledgment', 'INVALID_ACK');
    }
    
    // Process acknowledgment
    if (ws.userId) {
      await messageService.acknowledgeMessage(ws.userId, payload.messageId);
    }
    
    logger.debug(`Message acknowledged: ${payload.messageId}`, {
      userId: ws.userId,
      connectionId: ws.connectionId
    });
  }
  
  /**
   * Toggle compression for a client
   * 
   * @param {WebSocket} ws - WebSocket connection
   * @param {Object} payload - Message payload
   * @param {string} messageId - Message ID for acknowledgement
   */
  toggleCompression(ws, payload, messageId) {
    const useCompression = payload.enabled === true;
    
    ws.useCompression = useCompression;
    
    this.sendToClient(ws, 'compress', {
      enabled: useCompression,
      status: 'success'
    }, { id: messageId });
    
    logger.debug(`Client ${ws.connectionId} ${useCompression ? 'enabled' : 'disabled'} compression`);
  }
  
  /**
   * Send message to a specific client
   * 
   * @param {WebSocket} ws - WebSocket connection
   * @param {string} type - Message type
   * @param {Object} payload - Message payload
   * @param {Object} options - Additional options
   * @param {string} options.id - Message ID
   * @param {boolean} options.requireAck - Whether acknowledgment is required
   */
  async sendToClient(ws, type, payload, options = {}) {
    try {
      if (ws.readyState !== WebSocket.OPEN) {
        return false;
      }
      
      // Create message object
      const message = {
        type,
        payload,
        id: options.id || uuidv4(),
        timestamp: new Date().toISOString()
      };
      
      // Set acknowledgment flag if required
      if (options.requireAck) {
        message.requireAck = true;
      }
      
      // Convert to JSON
      const messageJson = JSON.stringify(message);
      
      // Compress if enabled
      let messageData = messageJson;
      if (ws.useCompression) {
        try {
          messageData = await deflateAsync(Buffer.from(messageJson));
        } catch (error) {
          logger.warn(`Failed to compress message: ${error.message}`);
          // Fall back to uncompressed message
          messageData = messageJson;
        }
      }
      
      // Send the message
      ws.send(messageData);
      this.stats.messagesSent++;
      
      // Track message sent in stats
      messageService.recordMessageSent(type);
      
      return true;
    } catch (error) {
      logger.error(`Error sending message to client: ${error.message}`, {
        connectionId: ws.connectionId,
        messageType: type,
        error
      });
      
      // Track failed message in stats
      messageService.recordMessageFailed(type);
      
      return false;
    }
  }
  
  /**
   * Send error message to client
   * 
   * @param {WebSocket} ws - WebSocket connection
   * @param {string} message - Error message
   * @param {string} code - Error code
   */
  sendError(ws, message, code = 'ERROR') {
    this.sendToClient(ws, 'error', {
      code,
      message,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Send message to a specific user (all connections)
   * 
   * @param {string} userId - User ID
   * @param {string} type - Message type
   * @param {Object} payload - Message payload
   * @param {Object} options - Additional options
   * @returns {Object} Delivery results
   */
  async sendToUser(userId, type, payload, options = {}) {
    const {
      requireAck = false,
      priority = false,
      queueIfOffline = true,
      channel = 'direct'
    } = options;
    
    // Get active connections for the user
    const connections = connectionService.getUserConnections(userId);
    let delivered = false;
    
    // Create a message object
    const messageId = options.messageId || uuidv4();
    const message = messageService.createMessage(type, payload, {
      id: messageId,
      priority,
      requireAck,
      channel
    });
    
    // Try to deliver to all active connections
    for (const connection of connections) {
      const success = await this.sendToClient(connection.ws, type, payload, {
        id: messageId,
        requireAck
      });
      
      if (success) {
        delivered = true;
      }
    }
    
    // If not delivered and queuing is enabled, store for later delivery
    if (!delivered && queueIfOffline) {
      const queued = messageService.queueOfflineMessage(userId, message);
      
      return {
        messageId,
        delivered: false,
        queued,
        connections: connections.length
      };
    }
    
    return {
      messageId,
      delivered,
      queued: false,
      connections: connections.length
    };
  }
  
  /**
   * Broadcast message to all connected clients or a subset
   * 
   * @param {string} type - Message type
   * @param {Object} payload - Message payload
   * @param {Object} options - Broadcast options
   * @param {string[]} options.userIds - Specific user IDs to broadcast to
   * @param {string} options.channel - Channel to broadcast on
   * @returns {Object} Broadcast results
   */
  broadcast(type, payload, options = {}) {
    const { 
      userIds,
      channel = 'broadcast',
      requireAck = false
    } = options;
    
    const messageId = options.messageId || uuidv4();
    let sentCount = 0;
    let failedCount = 0;
    
    // Function to send to a specific websocket
    const sendToWs = async (ws) => {
      const success = await this.sendToClient(ws, type, payload, {
        id: messageId,
        requireAck
      });
      
      if (success) {
        sentCount++;
      } else {
        failedCount++;
      }
    };
    
    // If specific users are specified, send only to them
    if (userIds && userIds.length > 0) {
      // For each user, get their connections and send
      for (const userId of userIds) {
        const connections = connectionService.getUserConnections(userId);
        for (const connection of connections) {
          sendToWs(connection.ws);
        }
      }
    } else {
      // Broadcast to everyone
      this.wss.clients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          sendToWs(ws);
        }
      });
    }
    
    return {
      messageId,
      sent: sentCount,
      failed: failedCount
    };
  }
  
  /**
   * Get WebSocket server statistics
   * 
   * @returns {Object} Server statistics
   */
  getStats() {
    return {
      ...this.stats,
      messageStats: messageService.getMessageStats(),
      timestamp: new Date()
    };
  }
  
  /**
   * Reset WebSocket server statistics
   */
  resetStats() {
    this.stats = {
      totalConnections: 0,
      activeConnections: this.stats.activeConnections,
      messagesReceived: 0,
      messagesSent: 0,
      errors: 0,
      lastResetTime: new Date()
    };
  }
}

module.exports = WebSocketManager; 