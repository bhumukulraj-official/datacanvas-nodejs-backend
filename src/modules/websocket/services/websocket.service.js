/**
 * WebSocket service
 * Provides methods for WebSocket operations and management with enhanced security
 * 
 * Security features:
 * - JWT token validation for all connections
 * - Rate limiting for WebSocket messages
 * - User-specific channel authorization
 * - Proper connection close handling with status codes
 * - Connection tracking and management
 */
const { WebSocketError } = require('../../../shared/errors');
const logger = require('../../../shared/utils/logger');
const config = require('../../../shared/config');
const jwt = require('jsonwebtoken');
const WebSocketConnection = require('../models/WebSocketConnection');
const WebSocketMessage = require('../models/WebSocketMessage');
const { setupWebSocketServer } = require('../../../shared/websocket/server');
const RateLimiter = require('../../../shared/utils/rateLimiter');

// Initialize WebSocket server variable
let wss = null;

// Rate limiter for WebSocket messages
const messageRateLimiter = new RateLimiter({
  windowMs: parseInt(process.env.WS_RATE_LIMIT_WINDOW_MS || '60000', 10), // Default: 1 minute
  maxRequests: parseInt(process.env.WS_RATE_LIMIT_MAX_MESSAGES || '50', 10), // Default: 50 messages per minute
  message: 'Too many messages sent from this connection, please try again later.'
});

/**
 * Validate JWT token for WebSocket connections
 * @param {String} token - JWT token to validate
 * @returns {Promise<Object>} User information from token
 * @throws {Error} If token is invalid
 */
const validateToken = async (token) => {
  try {
    if (!token) {
      throw new WebSocketError('Missing authentication token', 4001);
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded || !decoded.sub) {
      throw new WebSocketError('Invalid token format', 4001);
    }
    
    // Additional validation could be added here
    // e.g., check if user exists in database, has required permissions, etc.
    
    return decoded;
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new WebSocketError('Invalid token', 4001);
    } else if (error.name === 'TokenExpiredError') {
      throw new WebSocketError('Token expired', 4001);
    } else {
      throw error;
    }
  }
};

/**
 * Check if user has access to a specific channel
 * @param {String} userId - User ID
 * @param {String} channel - Channel name/path
 * @returns {Promise<Boolean>} Whether user has access
 */
const authorizeChannelAccess = async (userId, channel) => {
  // Skip authorization for public channels
  if (channel.startsWith('public:')) {
    return true;
  }
  
  // User-specific channels
  if (channel.startsWith('user:')) {
    const channelUserId = channel.split(':')[1];
    return userId === channelUserId;
  }
  
  // Admin channels would require role check
  if (channel.startsWith('admin:')) {
    // Get user from database and check role
    // This is a simplified example
    return false; // Deny by default
  }
  
  // Default deny for unrecognized channel patterns
  return false;
};

/**
 * Initialize WebSocket server with enhanced security
 * @param {Object} server - HTTP server instance
 * @returns {Object} WebSocket server instance
 */
exports.initialize = (server) => {
  if (!server) {
    throw new WebSocketError('HTTP server instance is required to initialize WebSocket server');
  }
  
  // Create WebSocket server with security options
  wss = setupWebSocketServer(server, {
    validateToken,
    authorizeChannelAccess,
    rateLimiter: messageRateLimiter,
    path: process.env.WS_PATH || '/api/v1/ws',
    maxPayloadSize: parseInt(process.env.WS_MAX_PAYLOAD_SIZE || '1048576', 10), // Default 1MB
    heartbeatInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL || '30000', 10) // Default 30s
  });
  
  logger.info('WebSocket server initialized with enhanced security');
  
  return wss;
};

/**
 * Get active WebSocket server instance
 * @returns {Object} WebSocket server instance
 */
exports.getServer = () => {
  if (!wss) {
    throw new WebSocketError('WebSocket server not initialized');
  }
  
  return wss;
};

/**
 * Send notification to specific user with security checks
 * @param {String} userId - User ID to send notification to
 * @param {Object} notification - Notification payload
 * @param {Object} options - Additional options
 * @param {Boolean} options.isPriority - Whether this is a priority message
 * @returns {Promise<Boolean>} Success status
 */
exports.sendNotification = async (userId, notification, options = {}) => {
  try {
    if (!wss) {
      throw new WebSocketError('WebSocket server not initialized');
    }
    
    if (!userId) {
      throw new WebSocketError('User ID is required');
    }
    
    const message = {
      type: 'notification',
      payload: {
        ...notification,
        timestamp: new Date().toISOString()
      }
    };
    
    // Sanitize notification payload to remove sensitive data
    if (message.payload.data && message.payload.data.sensitive) {
      delete message.payload.data.sensitive;
    }
    
    // Apply security checks before sending
    const userChannel = `user:${userId}`;
    
    // Broadcast to specific user channel
    const result = await wss.broadcastToChannel(userChannel, message, options.isPriority);
    
    logger.debug(`Notification sent to user ${userId}`, { 
      userId, 
      notificationType: notification.type,
      success: result
    });
    
    return result;
  } catch (error) {
    logger.error(`Failed to send notification: ${error.message}`, { userId });
    throw error;
  }
};

/**
 * Broadcast message to channel with security checks
 * @param {String} channel - Channel to broadcast to
 * @param {String} type - Message type
 * @param {Object} payload - Message payload
 * @param {Object} options - Additional options
 * @returns {Promise<Boolean>} Success status
 */
exports.broadcastToChannel = async (channel, type, payload, options = {}) => {
  try {
    if (!wss) {
      throw new WebSocketError('WebSocket server not initialized');
    }
    
    // Validate channel name format
    if (!channel || typeof channel !== 'string') {
      throw new WebSocketError('Invalid channel name');
    }
    
    const message = {
      type,
      payload: {
        ...payload,
        timestamp: new Date().toISOString()
      }
    };
    
    // Broadcast to channel
    const result = await wss.broadcastToChannel(channel, message, options.isPriority);
    
    logger.debug(`Message broadcast to channel ${channel}`, { 
      channel, 
      messageType: type,
      success: result
    });
    
    return result;
  } catch (error) {
    logger.error(`Failed to broadcast to channel: ${error.message}`, { channel });
    throw error;
  }
};

/**
 * Broadcast message to all connected clients (admin only)
 * @param {String} type - Message type
 * @param {Object} payload - Message payload
 * @param {String} adminToken - Admin authentication token
 * @returns {Promise<Boolean>} Success status
 */
exports.broadcast = async (type, payload, adminToken) => {
  try {
    if (!wss) {
      throw new WebSocketError('WebSocket server not initialized');
    }
    
    // Validate admin permissions
    if (!adminToken) {
      throw new WebSocketError('Admin token required for broadcast', 403);
    }
    
    // Verify admin token
    try {
      const decoded = await validateToken(adminToken);
      
      // Check if user is admin
      if (!decoded.role || decoded.role !== 'admin') {
        throw new WebSocketError('Insufficient permissions for global broadcast', 403);
      }
    } catch (error) {
      throw new WebSocketError('Authentication failed for broadcast operation', 403);
    }
    
    const message = {
      type,
      payload: {
        ...payload,
        timestamp: new Date().toISOString()
      }
    };
    
    // Global broadcasts are logged for audit purposes
    logger.info(`Global broadcast initiated`, { 
      messageType: type,
      initiatedBy: decoded.sub
    });
    
    // Broadcast to all connected clients
    await wss.broadcast(message);
    
    return true;
  } catch (error) {
    logger.error(`Failed to broadcast message: ${error.message}`);
    throw error;
  }
};

/**
 * Get active connections count with optional filtering
 * @param {Object} filters - Optional filters
 * @returns {Promise<Number>} Count of active connections
 */
exports.getActiveConnectionsCount = async (filters = {}) => {
  try {
    const whereClause = { is_active: true };
    
    // Apply additional filters if provided
    if (filters.userId) {
      whereClause.user_id = filters.userId;
    }
    
    if (filters.since) {
      whereClause.connected_at = {
        [Op.gte]: new Date(filters.since)
      };
    }
    
    const count = await WebSocketConnection.count({
      where: whereClause
    });
    
    return count;
  } catch (error) {
    logger.error(`Failed to get active connections count: ${error.message}`);
    throw error;
  }
};

/**
 * Get active connections for user
 * @param {String} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} List of active connections
 */
exports.getUserConnections = async (userId, options = {}) => {
  try {
    if (!userId) {
      throw new WebSocketError('User ID is required');
    }
    
    const whereClause = {
      user_id: userId,
      is_active: true
    };
    
    // Add timestamp filtering if provided
    if (options.since) {
      whereClause.connected_at = {
        [Op.gte]: new Date(options.since)
      };
    }
    
    const connections = await WebSocketConnection.findAll({
      where: whereClause,
      order: [['connected_at', 'DESC']],
      limit: options.limit || 100
    });
    
    return connections;
  } catch (error) {
    logger.error(`Failed to get user connections: ${error.message}`, { userId });
    throw error;
  }
};

/**
 * Disconnect user connections with specific close code and reason
 * @param {String} userId - User ID to disconnect
 * @param {Object} options - Additional options
 * @param {Number} options.code - WebSocket close code (default: 1000)
 * @param {String} options.reason - Close reason (default: 'Session terminated')
 * @returns {Promise<Number>} Number of connections closed
 */
exports.disconnectUserConnections = async (userId, options = {}) => {
  try {
    if (!userId) {
      throw new WebSocketError('User ID is required');
    }
    
    const closeCode = options.code || 1000;
    const closeReason = options.reason || 'Session terminated';
    
    // Update database records
    const [updatedCount] = await WebSocketConnection.update(
      { 
        is_active: false, 
        disconnected_at: new Date(),
        disconnect_reason: closeReason,
        close_code: closeCode
      },
      { where: { user_id: userId, is_active: true } }
    );
    
    // If WebSocket server is active, close active connections
    let closedConnections = 0;
    if (wss && wss.clients) {
      wss.clients.forEach((client) => {
        if (client.userId === userId) {
          client.close(closeCode, closeReason);
          closedConnections++;
        }
      });
    }
    
    logger.info(`Disconnected ${closedConnections} connections for user ${userId}`, { 
      userId, 
      closeCode,
      closeReason,
      databaseUpdates: updatedCount
    });
    
    return closedConnections;
  } catch (error) {
    logger.error(`Failed to disconnect user connections: ${error.message}`, { userId });
    throw error;
  }
};

/**
 * Subscribe client to channel with authorization check
 * @param {String} connectionId - Connection ID
 * @param {String} channel - Channel to subscribe to
 * @returns {Promise<Boolean>} Success status
 */
exports.subscribeToChannel = async (connectionId, channel) => {
  try {
    if (!wss) {
      throw new WebSocketError('WebSocket server not initialized');
    }
    
    const connection = await WebSocketConnection.findOne({
      where: { connection_id: connectionId, is_active: true }
    });
    
    if (!connection) {
      throw new WebSocketError('Connection not found or inactive');
    }
    
    // Check if user has access to this channel
    const authorized = await authorizeChannelAccess(connection.user_id, channel);
    
    if (!authorized) {
      logger.warn(`Unauthorized channel subscription attempt`, {
        userId: connection.user_id,
        connectionId,
        channel
      });
      
      return false;
    }
    
    // Add subscription to connection
    const result = await wss.subscribeToChannel(connectionId, channel);
    
    if (result) {
      logger.debug(`Subscribed connection ${connectionId} to channel ${channel}`, {
        connectionId,
        userId: connection.user_id,
        channel
      });
    }
    
    return result;
  } catch (error) {
    logger.error(`Failed to subscribe to channel: ${error.message}`, { connectionId, channel });
    throw error;
  }
};

/**
 * Unsubscribe client from channel
 * @param {String} connectionId - Connection ID
 * @param {String} channel - Channel to unsubscribe from
 * @returns {Promise<Boolean>} Success status
 */
exports.unsubscribeFromChannel = async (connectionId, channel) => {
  try {
    if (!wss) {
      throw new WebSocketError('WebSocket server not initialized');
    }
    
    const result = await wss.unsubscribeFromChannel(connectionId, channel);
    
    if (result) {
      logger.debug(`Unsubscribed connection ${connectionId} from channel ${channel}`, {
        connectionId,
        channel
      });
    }
    
    return result;
  } catch (error) {
    logger.error(`Failed to unsubscribe from channel: ${error.message}`, { connectionId, channel });
    throw error;
  }
}; 