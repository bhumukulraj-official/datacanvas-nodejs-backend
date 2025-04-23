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

  /**
   * Create a new WebSocket connection record
   * @param {Object} data - Connection data
   * @returns {Promise<Object>} Created connection
   */
  async createConnection(data) {
    try {
      const connection = await WebSocketConnection.create({
        connection_id: data.connectionId,
        user_id: data.userId,
        status: data.status || 'active',
        client_ip: data.ipAddress,
        user_agent: data.userAgent,
        connected_at: new Date(),
        metadata: typeof data.metadata === 'string' ? data.metadata : JSON.stringify(data.metadata || {})
      });
      
      logger.debug(`WebSocket connection created in database: ${data.connectionId}`, {
        userId: data.userId
      });
      
      return connection;
    } catch (error) {
      logger.error(`Failed to create connection record: ${error.message}`, {
        connectionId: data.connectionId,
        userId: data.userId,
        error
      });
      
      throw error;
    }
  }
  
  /**
   * Update connection status
   * @param {String} connectionId - Connection ID
   * @param {Object} data - Updated data
   * @returns {Promise<Boolean>} Success status
   */
  async updateConnection(connectionId, data) {
    try {
      const [updated] = await WebSocketConnection.update({
        status: data.status,
        disconnected_at: data.disconnectedAt,
        disconnect_reason: data.disconnectReason,
        disconnect_code: data.disconnectCode,
        updated_at: new Date()
      }, {
        where: { connection_id: connectionId }
      });
      
      logger.debug(`WebSocket connection updated: ${connectionId}`, {
        status: data.status
      });
      
      return updated > 0;
    } catch (error) {
      logger.error(`Failed to update connection: ${error.message}`, {
        connectionId,
        error
      });
      
      throw error;
    }
  }
  
  /**
   * Get connection details by ID
   * @param {String} connectionId - Connection ID
   * @returns {Promise<Object>} Connection details
   */
  async getConnectionById(connectionId) {
    try {
      const connection = await WebSocketConnection.findOne({
        where: { connection_id: connectionId }
      });
      
      return connection;
    } catch (error) {
      logger.error(`Failed to get connection: ${error.message}`, {
        connectionId,
        error
      });
      
      throw error;
    }
  }
  
  /**
   * Get all connections with pagination and filters
   * @param {Number} page - Page number
   * @param {Number} limit - Items per page
   * @param {String} status - Optional status filter
   * @returns {Promise<Object>} Paginated connections
   */
  async getAllConnections(page = 1, limit = 10, status = null) {
    try {
      const offset = (page - 1) * limit;
      const whereClause = {};
      
      if (status) {
        whereClause.status = status;
      }
      
      const { count, rows } = await WebSocketConnection.findAndCountAll({
        where: whereClause,
        limit: limit,
        offset: offset,
        order: [['connected_at', 'DESC']]
      });
      
      return {
        connections: rows,
        total: count,
        page: page,
        limit: limit,
        totalPages: Math.ceil(count / limit)
      };
    } catch (error) {
      logger.error(`Failed to get connections: ${error.message}`, { error });
      throw error;
    }
  }
  
  /**
   * Get user connections
   * @param {String} userId - User ID
   * @param {String} status - Optional status filter
   * @returns {Promise<Array>} User connections
   */
  async getUserConnections(userId, status = null) {
    try {
      const whereClause = { user_id: userId };
      
      if (status) {
        whereClause.status = status;
      }
      
      const connections = await WebSocketConnection.findAll({
        where: whereClause,
        order: [['connected_at', 'DESC']]
      });
      
      return connections;
    } catch (error) {
      logger.error(`Failed to get user connections: ${error.message}`, {
        userId,
        error
      });
      
      throw error;
    }
  }
  
  /**
   * Subscribe to channel
   * @param {String} connectionId - Connection ID
   * @param {String} channel - Channel name
   * @returns {Promise<Boolean>} Success status
   */
  async subscribeToChannel(connectionId, channel) {
    try {
      // This implementation would typically update a channel subscriptions table
      // For now, we'll just log it
      logger.debug(`Subscription to channel: ${channel}`, {
        connectionId,
        channel
      });
      
      return true;
    } catch (error) {
      logger.error(`Failed to subscribe to channel: ${error.message}`, {
        connectionId,
        channel,
        error
      });
      
      return false;
    }
  }
  
  /**
   * Unsubscribe from channel
   * @param {String} connectionId - Connection ID
   * @param {String} channel - Channel name
   * @returns {Promise<Boolean>} Success status
   */
  async unsubscribeFromChannel(connectionId, channel) {
    try {
      // This implementation would typically update a channel subscriptions table
      // For now, we'll just log it
      logger.debug(`Unsubscribed from channel: ${channel}`, {
        connectionId,
        channel
      });
      
      return true;
    } catch (error) {
      logger.error(`Failed to unsubscribe from channel: ${error.message}`, {
        connectionId,
        channel,
        error
      });
      
      return false;
    }
  }
}

module.exports = new ConnectionService(); 