const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const logger = require('../../../shared/utils/logger');
const WebSocketConnection = require('../models/WebSocketConnection');
const config = require('../../../shared/config');

class ConnectionService {
  constructor() {
    this.activeConnections = new Map();
    this.reconnectAttempts = new Map();
  }

  /**
   * Authenticate WebSocket connection using JWT token
   * @param {String} token - JWT token
   * @returns {Object} Decoded user information
   */
  async authenticateConnection(token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      if (!decoded || !decoded.sub) {
        throw new Error('Invalid token');
      }
      return decoded;
    } catch (error) {
      logger.error('WebSocket authentication failed:', error);
      throw new Error('Authentication failed');
    }
  }

  /**
   * Track new WebSocket connection
   * @param {WebSocket} ws - WebSocket connection
   * @param {Object} user - Authenticated user
   * @param {Object} clientInfo - Client information
   * @returns {String} Connection ID
   */
  async trackConnection(ws, user, clientInfo) {
    const connectionId = uuidv4();
    
    // Store connection details
    const connection = await WebSocketConnection.create({
      connection_id: connectionId,
      user_id: user.sub,
      client_ip: clientInfo.ip,
      user_agent: clientInfo.userAgent,
      connected_at: new Date(),
      is_active: true
    });

    // Add to active connections map
    this.activeConnections.set(connectionId, {
      ws,
      userId: user.sub,
      connectionId,
      connectedAt: new Date(),
      clientInfo,
      isAlive: true
    });

    // Reset reconnection attempts on successful connection
    this.reconnectAttempts.delete(user.sub);

    return connectionId;
  }

  /**
   * Handle connection close
   * @param {String} connectionId - Connection ID
   * @param {String} userId - User ID
   */
  async handleDisconnect(connectionId, userId) {
    try {
      // Update connection status in database
      await WebSocketConnection.update(
        { is_active: false, disconnected_at: new Date() },
        { where: { connection_id: connectionId } }
      );
      
      // Remove from active connections
      this.activeConnections.delete(connectionId);
      
      logger.info(`WebSocket connection closed for user ${userId}`, {
        userId,
        connectionId
      });
    } catch (error) {
      logger.error(`Error handling WebSocket disconnect: ${error.message}`);
    }
  }

  /**
   * Get reconnection delay with exponential backoff
   * @param {String} userId - User ID
   * @returns {Number} Delay in milliseconds
   */
  getReconnectionDelay(userId) {
    const attempts = this.reconnectAttempts.get(userId) || 0;
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    
    // Calculate exponential backoff
    const delay = Math.min(baseDelay * Math.pow(2, attempts), maxDelay);
    
    // Increment attempts counter
    this.reconnectAttempts.set(userId, attempts + 1);
    
    return delay;
  }

  /**
   * Get all active connections for a user
   * @param {String} userId - User ID
   * @returns {Array} Array of active connections
   */
  getUserConnections(userId) {
    return Array.from(this.activeConnections.values())
      .filter(conn => conn.userId === userId);
  }

  /**
   * Check if connection is alive and update status
   * @param {String} connectionId - Connection ID
   * @returns {Boolean} Connection status
   */
  isConnectionAlive(connectionId) {
    const connection = this.activeConnections.get(connectionId);
    if (!connection) return false;
    
    if (!connection.isAlive) {
      this.handleDisconnect(connectionId, connection.userId);
      return false;
    }
    
    return true;
  }

  /**
   * Update connection alive status
   * @param {String} connectionId - Connection ID
   * @param {Boolean} status - Alive status
   */
  updateConnectionStatus(connectionId, status) {
    const connection = this.activeConnections.get(connectionId);
    if (connection) {
      connection.isAlive = status;
    }
  }
}

module.exports = new ConnectionService(); 