const logger = require('../../../shared/utils/logger');
const WebSocketMessage = require('../models/WebSocketMessage');
const connectionService = require('./connection.service');

class MessageService {
  constructor() {
    this.messageHandlers = new Map();
    this.setupDefaultHandlers();
  }

  /**
   * Set up default message type handlers
   */
  setupDefaultHandlers() {
    this.registerHandler('ping', this.handlePing.bind(this));
    this.registerHandler('notification:ack', this.handleNotificationAck.bind(this));
  }

  /**
   * Register a message handler for a specific message type
   * @param {String} messageType - Type of message to handle
   * @param {Function} handler - Handler function
   */
  registerHandler(messageType, handler) {
    this.messageHandlers.set(messageType, handler);
  }

  /**
   * Validate message structure
   * @param {Object} message - Message to validate
   * @returns {Boolean} Validation result
   */
  validateMessage(message) {
    // Basic structure validation
    if (!message || typeof message !== 'object') {
      return false;
    }

    // Required fields validation
    if (!message.type || typeof message.type !== 'string') {
      return false;
    }

    if (!message.payload || typeof message.payload !== 'object') {
      return false;
    }

    // Message type validation
    if (!this.messageHandlers.has(message.type)) {
      return false;
    }

    return true;
  }

  /**
   * Handle incoming WebSocket message
   * @param {WebSocket} ws - WebSocket connection
   * @param {String|Buffer} data - Raw message data
   */
  async handleMessage(ws, data) {
    try {
      // Parse message
      const message = JSON.parse(data.toString());

      // Validate message
      if (!this.validateMessage(message)) {
        return this.sendError(ws, 'Invalid message format', 'WS_002');
      }

      // Store message in database
      await this.persistMessage(ws.connectionId, ws.userId, message);

      // Route message to appropriate handler
      const handler = this.messageHandlers.get(message.type);
      if (handler) {
        await handler(ws, message.payload);
      } else {
        logger.warn(`No handler found for message type: ${message.type}`);
      }

    } catch (error) {
      logger.error('Error handling WebSocket message:', error);
      this.sendError(ws, 'Failed to process message', 'WS_003');
    }
  }

  /**
   * Persist message to database
   * @param {String} connectionId - Connection ID
   * @param {String} userId - User ID
   * @param {Object} message - Message object
   */
  async persistMessage(connectionId, userId, message) {
    try {
      await WebSocketMessage.create({
        connection_id: connectionId,
        user_id: userId,
        message_type: message.type,
        message_data: JSON.stringify(message.payload),
        created_at: new Date()
      });
    } catch (error) {
      logger.error('Failed to persist WebSocket message:', error);
    }
  }

  /**
   * Send message to specific user
   * @param {String} userId - User ID
   * @param {String} type - Message type
   * @param {Object} payload - Message payload
   */
  sendToUser(userId, type, payload) {
    const connections = connectionService.getUserConnections(userId);
    const message = JSON.stringify({ type, payload });

    connections.forEach(({ ws }) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(message);
      }
    });
  }

  /**
   * Broadcast message to all connected clients
   * @param {String} type - Message type
   * @param {Object} payload - Message payload
   */
  broadcast(type, payload) {
    const message = JSON.stringify({ type, payload });
    
    Array.from(connectionService.activeConnections.values()).forEach(({ ws }) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(message);
      }
    });
  }

  /**
   * Send error message to client
   * @param {WebSocket} ws - WebSocket connection
   * @param {String} message - Error message
   * @param {String} code - Error code
   */
  sendError(ws, message, code = 'WS_001') {
    try {
      ws.send(JSON.stringify({
        type: 'error',
        payload: {
          code,
          message,
          timestamp: new Date().toISOString()
        }
      }));
    } catch (error) {
      logger.error('Failed to send error message:', error);
    }
  }

  /**
   * Handle ping message
   * @param {WebSocket} ws - WebSocket connection
   */
  async handlePing(ws) {
    ws.send(JSON.stringify({
      type: 'pong',
      payload: { timestamp: new Date().toISOString() }
    }));
  }

  /**
   * Handle notification acknowledgment
   * @param {WebSocket} ws - WebSocket connection
   * @param {Object} payload - Message payload
   */
  async handleNotificationAck(ws, payload) {
    // Implementation for notification acknowledgment
    logger.debug('Notification acknowledged:', {
      userId: ws.userId,
      connectionId: ws.connectionId,
      notificationId: payload.notificationId
    });
  }

  /**
   * Get array of connected user IDs
   * @returns {Array} Array of user IDs
   */
  getConnectedUserIds() {
    const userIds = new Set();
    
    // Iterate through all clients to collect unique user IDs
    this.wss.clients.forEach(client => {
      if (client.userId) {
        userIds.add(client.userId);
      }
    });
    
    return Array.from(userIds);
  }
}

module.exports = new MessageService(); 