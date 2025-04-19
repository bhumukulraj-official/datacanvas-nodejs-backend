/**
 * WebSocket service
 * Provides methods for WebSocket operations and management
 */
const { WebSocketError } = require('../../../shared/errors');
const logger = require('../../../shared/utils/logger');
const WebSocketConnection = require('../models/WebSocketConnection');
const WebSocketMessage = require('../models/WebSocketMessage');
const { setupWebSocketServer } = require('../../../shared/websocket/server');

let wss = null;

/**
 * Initialize WebSocket server
 * @param {Object} server - HTTP server instance
 */
exports.initialize = (server) => {
  if (!server) {
    throw new WebSocketError('HTTP server instance is required to initialize WebSocket server');
  }
  
  wss = setupWebSocketServer(server);
  logger.info('WebSocket server initialized');
  
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
 * Send notification to specific user
 * @param {String} userId - User ID to send notification to
 * @param {Object} notification - Notification payload
 */
exports.sendNotification = (userId, notification) => {
  try {
    if (!wss) {
      throw new WebSocketError('WebSocket server not initialized');
    }
    
    const message = {
      type: 'notification',
      payload: {
        ...notification,
        timestamp: new Date().toISOString()
      }
    };
    
    // Broadcast to specific user
    wss.broadcast(message, userId);
    
    logger.debug(`Notification sent to user ${userId}`, { 
      userId, 
      notificationType: notification.type 
    });
  } catch (error) {
    logger.error(`Failed to send notification: ${error.message}`, { userId });
    throw error;
  }
};

/**
 * Broadcast message to all connected clients
 * @param {String} type - Message type
 * @param {Object} payload - Message payload
 */
exports.broadcast = (type, payload) => {
  try {
    if (!wss) {
      throw new WebSocketError('WebSocket server not initialized');
    }
    
    const message = {
      type,
      payload: {
        ...payload,
        timestamp: new Date().toISOString()
      }
    };
    
    // Broadcast to all connected clients
    wss.broadcast(message);
    
    logger.debug(`Broadcast message sent`, { messageType: type });
  } catch (error) {
    logger.error(`Failed to broadcast message: ${error.message}`);
    throw error;
  }
};

/**
 * Get active connections count
 * @returns {Number} Count of active connections
 */
exports.getActiveConnectionsCount = async () => {
  try {
    const count = await WebSocketConnection.count({
      where: { is_active: true }
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
 * @returns {Array} List of active connections
 */
exports.getUserConnections = async (userId) => {
  try {
    const connections = await WebSocketConnection.findAll({
      where: {
        user_id: userId,
        is_active: true
      },
      order: [['connected_at', 'DESC']]
    });
    
    return connections;
  } catch (error) {
    logger.error(`Failed to get user connections: ${error.message}`, { userId });
    throw error;
  }
};

/**
 * Disconnect user connections
 * @param {String} userId - User ID to disconnect
 */
exports.disconnectUserConnections = async (userId) => {
  try {
    // Update database records
    await WebSocketConnection.update(
      { is_active: false, disconnected_at: new Date() },
      { where: { user_id: userId, is_active: true } }
    );
    
    // If WebSocket server is active, close active connections
    if (wss) {
      wss.clients.forEach((client) => {
        if (client.userId === userId) {
          client.close(1000, 'Session terminated');
        }
      });
    }
    
    logger.info(`Disconnected all connections for user ${userId}`, { userId });
  } catch (error) {
    logger.error(`Failed to disconnect user connections: ${error.message}`, { userId });
    throw error;
  }
}; 