/**
 * WebSocket client service
 * Manages individual client connections and state
 * 
 * Features:
 * - Client authentication and authorization
 * - Connection tracking
 * - Channel subscription management
 * - Secure message handling
 * - Offline message delivery
 * - Message acknowledgment support
 */
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const { WebSocketError } = require('../../../shared/errors');
const logger = require('../../../shared/utils/logger');
const connectionService = require('./connection.service');
const messageService = require('./message.service');

/**
 * WebSocket close codes (RFC 6455)
 */
const WS_CLOSE_CODES = {
  NORMAL: 1000,
  GOING_AWAY: 1001,
  PROTOCOL_ERROR: 1002,
  UNSUPPORTED_DATA: 1003,
  INVALID_DATA: 1007,
  POLICY_VIOLATION: 1008,
  MESSAGE_TOO_BIG: 1009,
  INTERNAL_ERROR: 1011,
  
  // Custom codes
  AUTHENTICATION_FAILED: 4001,
  AUTHORIZATION_FAILED: 4003,
  RATE_LIMITED: 4029,
  INVALID_MESSAGE: 4400
};

/**
 * Client class to handle a single WebSocket connection
 */
class WebSocketClient {
  /**
   * Create a new client instance
   * @param {WebSocket} ws - WebSocket connection
   * @param {Object} user - Authenticated user info
   * @param {String} connectionId - Unique connection ID
   * @param {Object} options - Client options
   */
  constructor(ws, user, connectionId, options = {}) {
    this.ws = ws;
    this.user = user;
    this.connectionId = connectionId || uuidv4();
    this.userId = user ? user.id : null;
    this.channels = new Set();
    this.isAlive = true;
    this.createdAt = new Date();
    this.lastActivityAt = new Date();
    this.closedAt = null;
    this.closeCode = null;
    this.closeReason = null;
    this.metadata = options.metadata || {};
    this.ip = options.ip || null;
    this.userAgent = options.userAgent || null;
    this.pendingMessages = new Map(); // Track messages waiting for acknowledgment
    this.pendingAcks = new Set(); // Set of message IDs waiting for acknowledgment
    this.capabilityFlags = options.capabilities || { 
      supportsAcks: false,
      supportsOfflineMessages: false, 
      supportsBinary: true 
    };
    
    // Set up event handlers
    this._setupEventHandlers();
    
    // Track connection in database
    this._trackConnection();
    
    // Check for pending messages if client supports it
    if (this.capabilityFlags.supportsOfflineMessages) {
      this._deliverOfflineMessages();
    }
  }
  
  /**
   * Set up WebSocket event handlers
   * @private
   */
  _setupEventHandlers() {
    this.ws.on('message', (data) => this._handleMessage(data));
    this.ws.on('close', (code, reason) => this._handleClose(code, reason));
    this.ws.on('error', (error) => this._handleError(error));
    this.ws.on('pong', () => this._handlePong());
  }
  
  /**
   * Track connection in database
   * @private
   */
  async _trackConnection() {
    try {
      await connectionService.createConnection({
        connectionId: this.connectionId,
        userId: this.userId,
        status: 'active',
        metadata: {
          ...this.metadata,
          capabilities: this.capabilityFlags
        },
        userAgent: this.userAgent,
        ipAddress: this.ip
      });
      
      logger.info(`WebSocket connection created: ${this.connectionId}`, {
        userId: this.userId,
        connectionId: this.connectionId
      });
    } catch (error) {
      logger.error(`Failed to track WebSocket connection: ${error.message}`, {
        userId: this.userId,
        connectionId: this.connectionId
      });
    }
  }
  
  /**
   * Deliver any pending offline messages
   * @private
   */
  async _deliverOfflineMessages() {
    try {
      // Get pending messages
      const pendingMessages = await messageService.getPendingMessages(this.userId, {
        limit: 50, // Reasonable batch size
        onlyHighPriority: false // Include all messages
      });
      
      if (pendingMessages.length === 0) {
        return;
      }
      
      logger.info(`Delivering ${pendingMessages.length} offline messages to user ${this.userId}`);
      
      // Send messages with a small delay between them to avoid overwhelming the client
      const messageIds = [];
      
      for (let i = 0; i < pendingMessages.length; i++) {
        const message = pendingMessages[i];
        
        // Add slight delay to avoid overwhelming client (2ms * message index)
        await new Promise(resolve => setTimeout(resolve, 2 * i));
        
        // Skip if client disconnected during delivery
        if (this.ws.readyState !== WebSocket.OPEN) {
          break;
        }
        
        // Send the message
        const sent = await this._sendOfflineMessage(message);
        
        if (sent) {
          messageIds.push(message.id);
          
          // Track as pending acknowledgment if client supports it
          if (this.capabilityFlags.supportsAcks) {
            this.pendingAcks.add(message.id);
          }
        }
      }
      
      // If client doesn't support acknowledgments, mark as delivered immediately
      if (!this.capabilityFlags.supportsAcks && messageIds.length > 0) {
        await messageService.markMessagesDelivered(messageIds);
      }
    } catch (error) {
      logger.error(`Failed to deliver offline messages: ${error.message}`, {
        userId: this.userId,
        connectionId: this.connectionId
      });
    }
  }
  
  /**
   * Send offline message to client
   * @param {Object} message - Message to send
   * @returns {Promise<Boolean>} Success status
   * @private
   */
  async _sendOfflineMessage(message) {
    try {
      // Prepare the message with metadata for the client
      const clientMessage = {
        id: message.id,
        type: message.type,
        channel: message.channel,
        data: message.data,
        timestamp: message.created_at,
        offline: true,
        requiresAck: this.capabilityFlags.supportsAcks
      };
      
      return new Promise(resolve => {
        this.ws.send(JSON.stringify(clientMessage), error => {
          if (error) {
            logger.error(`Failed to send offline message: ${error.message}`, {
              messageId: message.id,
              userId: this.userId
            });
            resolve(false);
          } else {
            resolve(true);
          }
        });
      });
    } catch (error) {
      logger.error(`Error preparing offline message: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Handle incoming message
   * @param {Buffer|String} data - Message data
   * @private
   */
  async _handleMessage(data) {
    try {
      this.lastActivityAt = new Date();
      
      let message;
      try {
        message = JSON.parse(data.toString());
      } catch (error) {
        return this.sendError('Invalid JSON format', WS_CLOSE_CODES.INVALID_DATA);
      }
      
      if (!message.type) {
        return this.sendError('Message type is required', WS_CLOSE_CODES.INVALID_DATA);
      }
      
      // Process different message types
      switch (message.type) {
        case 'ping':
          this.send({ type: 'pong', timestamp: new Date().toISOString() });
          break;
          
        case 'subscribe':
          await this._handleSubscribe(message);
          break;
          
        case 'unsubscribe':
          await this._handleUnsubscribe(message);
          break;
          
        case 'ack':
          await this._handleAcknowledgment(message);
          break;
          
        case 'capabilities':
          await this._handleCapabilities(message);
          break;
          
        default:
          // Unknown message type
          logger.warn(`Unknown message type: ${message.type}`, {
            connectionId: this.connectionId,
            userId: this.userId
          });
      }
    } catch (error) {
      logger.error(`Error handling WebSocket message: ${error.message}`, {
        connectionId: this.connectionId,
        userId: this.userId,
        error
      });
      
      this.sendError(`Error processing message: ${error.message}`);
    }
  }
  
  /**
   * Handle message acknowledgment
   * @param {Object} message - Acknowledgment message
   * @private
   */
  async _handleAcknowledgment(message) {
    try {
      if (!message.id) {
        return this.sendError('Message ID is required for acknowledgment');
      }
      
      // Process acknowledgment
      const success = await messageService.acknowledgeMessage(
        message.id,
        this.userId,
        message.metadata || {}
      );
      
      if (success) {
        // Remove from pending set
        this.pendingAcks.delete(message.id);
        
        // Send confirmation if client expects it
        if (message.requiresConfirmation) {
          this.send({
            type: 'ack_confirmed',
            id: message.id,
            timestamp: new Date().toISOString()
          });
        }
      } else {
        logger.warn(`Failed to process acknowledgment for message: ${message.id}`, {
          userId: this.userId
        });
      }
    } catch (error) {
      logger.error(`Error handling acknowledgment: ${error.message}`);
    }
  }
  
  /**
   * Handle client capabilities negotiation
   * @param {Object} message - Capabilities message
   * @private
   */
  async _handleCapabilities(message) {
    try {
      // Update capability flags
      this.capabilityFlags = {
        ...this.capabilityFlags,
        ...(message.capabilities || {})
      };
      
      // Update connection record with new capabilities
      await connectionService.updateConnection(this.connectionId, {
        metadata: {
          ...this.metadata,
          capabilities: this.capabilityFlags
        }
      });
      
      // Confirm capabilities
      this.send({
        type: 'capabilities_confirmed',
        capabilities: this.capabilityFlags,
        timestamp: new Date().toISOString()
      });
      
      // If client just enabled offline messages, deliver them
      if (message.capabilities?.supportsOfflineMessages && !this.deliveredOfflineMessages) {
        this.deliveredOfflineMessages = true;
        await this._deliverOfflineMessages();
      }
    } catch (error) {
      logger.error(`Error handling capabilities: ${error.message}`);
    }
  }
  
  /**
   * Handle channel subscription
   * @param {Object} message - Subscription message
   * @private
   */
  async _handleSubscribe(message) {
    try {
      if (!message.channel) {
        return this.sendError('Channel name is required for subscription');
      }
      
      // Check if user has access to this channel
      const canAccess = await this._authorizeChannelAccess(message.channel);
      if (!canAccess) {
        return this.sendError(`Not authorized to subscribe to channel: ${message.channel}`, 
          WS_CLOSE_CODES.AUTHORIZATION_FAILED);
      }
      
      // Add to client channels
      this.channels.add(message.channel);
      
      // Track in database
      await connectionService.subscribeToChannel(this.connectionId, message.channel);
      
      // Confirm subscription
      this.send({
        type: 'subscribed',
        channel: message.channel,
        timestamp: new Date().toISOString()
      });
      
      logger.debug(`Client subscribed to channel: ${message.channel}`, {
        connectionId: this.connectionId,
        userId: this.userId,
        channel: message.channel
      });
    } catch (error) {
      logger.error(`Failed to subscribe to channel: ${error.message}`, {
        connectionId: this.connectionId,
        userId: this.userId,
        channel: message.channel
      });
      
      this.sendError(`Failed to subscribe: ${error.message}`);
    }
  }
  
  /**
   * Handle channel unsubscription
   * @param {Object} message - Unsubscription message
   * @private
   */
  async _handleUnsubscribe(message) {
    try {
      if (!message.channel) {
        return this.sendError('Channel name is required for unsubscription');
      }
      
      // Remove from client channels
      this.channels.delete(message.channel);
      
      // Track in database
      await connectionService.unsubscribeFromChannel(this.connectionId, message.channel);
      
      // Confirm unsubscription
      this.send({
        type: 'unsubscribed',
        channel: message.channel,
        timestamp: new Date().toISOString()
      });
      
      logger.debug(`Client unsubscribed from channel: ${message.channel}`, {
        connectionId: this.connectionId,
        userId: this.userId,
        channel: message.channel
      });
    } catch (error) {
      logger.error(`Failed to unsubscribe from channel: ${error.message}`, {
        connectionId: this.connectionId,
        userId: this.userId,
        channel: message.channel
      });
      
      this.sendError(`Failed to unsubscribe: ${error.message}`);
    }
  }
  
  /**
   * Authorize channel access
   * @param {String} channel - Channel name
   * @returns {Promise<Boolean>} Whether user has access
   * @private
   */
  async _authorizeChannelAccess(channel) {
    // Public channels are accessible by anyone
    if (channel.startsWith('public:')) {
      return true;
    }
    
    // User-specific channels
    if (channel.startsWith('user:')) {
      const channelUserId = channel.split(':')[1];
      return this.userId && this.userId.toString() === channelUserId;
    }
    
    // Admin channels
    if (channel.startsWith('admin:')) {
      return this.user && this.user.role === 'admin';
    }
    
    // Default deny for unrecognized channel patterns
    return false;
  }
  
  /**
   * Handle WebSocket close event
   * @param {Number} code - Close code
   * @param {String} reason - Close reason
   * @private
   */
  async _handleClose(code, reason) {
    try {
      this.isAlive = false;
      this.closedAt = new Date();
      this.closeCode = code;
      this.closeReason = reason;
      
      // Update connection status in database
      await connectionService.updateConnection(this.connectionId, {
        status: 'disconnected',
        disconnectedAt: this.closedAt,
        disconnectReason: reason,
        disconnectCode: code
      });
      
      logger.info(`WebSocket connection closed: ${this.connectionId}`, {
        userId: this.userId,
        connectionId: this.connectionId,
        code,
        reason
      });
    } catch (error) {
      logger.error(`Error handling WebSocket close: ${error.message}`, {
        connectionId: this.connectionId,
        userId: this.userId,
        error
      });
    }
  }
  
  /**
   * Handle WebSocket error event
   * @param {Error} error - Error object
   * @private
   */
  _handleError(error) {
    logger.error(`WebSocket error: ${error.message}`, {
      connectionId: this.connectionId,
      userId: this.userId,
      error
    });
    
    this.sendError(`WebSocket error: ${error.message}`, WS_CLOSE_CODES.INTERNAL_ERROR);
  }
  
  /**
   * Handle pong response (used for heartbeat)
   * @private
   */
  _handlePong() {
    this.isAlive = true;
    this.lastActivityAt = new Date();
  }
  
  /**
   * Send ping message for heartbeat
   */
  sendPing() {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.ping();
    }
  }
  
  /**
   * Send message with delivery tracking
   * @param {Object} message - Message to send
   * @param {Object} options - Send options
   * @returns {Promise<Boolean>} Success status
   */
  async send(message, options = {}) {
    try {
      if (this.ws.readyState !== WebSocket.OPEN) {
        return false;
      }
      
      // Add message ID and timestamp if not present
      if (!message.id) {
        message.id = uuidv4();
      }
      
      if (!message.timestamp) {
        message.timestamp = new Date().toISOString();
      }
      
      // Add acknowledgment requirement if client supports it
      if (this.capabilityFlags.supportsAcks && options.requireAck !== false) {
        message.requiresAck = true;
        this.pendingAcks.add(message.id);
        
        // Set acknowledgment timeout
        const timeoutMs = options.ackTimeoutMs || 30000; // Default 30s
        setTimeout(() => {
          if (this.pendingAcks.has(message.id)) {
            this.pendingAcks.delete(message.id);
            logger.warn(`Acknowledgment timeout for message: ${message.id}`, {
              userId: this.userId
            });
            
            // Record as failed delivery if tracking is requested
            if (options.trackDelivery) {
              messageService.updateMessageStatus(message.id, 'failed', 'Acknowledgment timeout');
            }
          }
        }, timeoutMs);
      }
      
      // Track delivery in database if requested
      if (options.trackDelivery) {
        await messageService.createMessageRecord({
          type: message.type,
          userId: this.userId,
          channel: options.channel || 'direct',
          messageId: message.id,
          data: message
        });
      }
      
      return new Promise(resolve => {
        this.ws.send(JSON.stringify(message), error => {
          if (error) {
            logger.error(`Failed to send message: ${error.message}`, {
              messageId: message.id,
              userId: this.userId
            });
            
            // Update delivery status if tracking
            if (options.trackDelivery) {
              messageService.updateMessageStatus(message.id, 'failed', error.message);
            }
            
            resolve(false);
          } else {
            // Update delivery status if not requiring acknowledgment and tracking
            if (options.trackDelivery && !message.requiresAck) {
              messageService.updateMessageStatus(message.id, 'delivered');
            }
            
            resolve(true);
          }
        });
      });
    } catch (error) {
      logger.error(`Send message error: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Send error message to client
   * @param {String} message - Error message
   * @param {Number} code - Error code
   * @returns {Promise<Boolean>} Success status
   */
  async sendError(message, code) {
    try {
      return this.send({
        type: 'error',
        error: {
          message,
          code: code || 'ERROR'
        }
      });
    } catch (error) {
      logger.error(`Failed to send error message: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Check if client is subscribed to channel
   * @param {String} channel - Channel name
   * @returns {Boolean} Whether client is subscribed
   */
  isSubscribedTo(channel) {
    return this.channels.has(channel);
  }
  
  /**
   * Close the WebSocket connection
   * @param {Number} code - Close code
   * @param {String} reason - Close reason
   */
  close(code = WS_CLOSE_CODES.NORMAL, reason = 'Connection closed') {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.close(code, reason);
    }
  }
}

module.exports = WebSocketClient; 