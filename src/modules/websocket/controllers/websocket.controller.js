const websocketService = require('../services/websocket.service');
const connectionService = require('../services/connection.service');
const { NotFoundError } = require('../../../shared/errors');
const logger = require('../../../shared/utils/logger');

/**
 * Get all active connections
 */
exports.getAllConnections = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const result = await connectionService.getAllConnections(
      parseInt(page), 
      parseInt(limit), 
      status
    );
    
    return res.status(200).json({
      success: true,
      data: result,
      message: 'WebSocket connections retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get connections for a specific user
 */
exports.getUserConnections = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;
    
    const connections = await connectionService.getUserConnections(userId, status);
    
    return res.status(200).json({
      success: true,
      data: connections,
      message: 'User WebSocket connections retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get connection details
 */
exports.getConnectionById = async (req, res, next) => {
  try {
    const { connectionId } = req.params;
    
    const connection = await connectionService.getConnectionById(connectionId);
    
    if (!connection) {
      throw new NotFoundError('WebSocket connection not found');
    }
    
    return res.status(200).json({
      success: true,
      data: connection,
      message: 'WebSocket connection retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Forcefully disconnect a WebSocket connection
 * Admin only
 */
exports.disconnectConnection = async (req, res, next) => {
  try {
    const { connectionId } = req.params;
    const { reason } = req.body;
    
    const success = await websocketService.disconnectClient(connectionId, reason || 'Admin disconnected');
    
    return res.status(200).json({
      success: true,
      data: { disconnected: success },
      message: success ? 'Connection disconnected successfully' : 'Connection already disconnected or not found',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send a message to a specific user
 */
exports.sendMessageToUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { type, payload, priority } = req.body;
    
    const messageId = await websocketService.sendNotification(
      userId, 
      { type, data: payload }, 
      { isPriority: priority === true }
    );
    
    return res.status(200).json({
      success: true,
      data: { messageId },
      message: 'Message sent successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Error sending message to user: ${error.message}`);
    next(error);
  }
};

/**
 * Send a broadcast message to all users or a specific channel
 * Admin only
 */
exports.broadcastMessage = async (req, res, next) => {
  try {
    const { channel, type, payload, priority } = req.body;
    
    if (!channel) {
      throw new Error('Channel is required');
    }
    
    const result = await websocketService.broadcastToChannel(
      channel, 
      type, 
      payload, 
      { isPriority: priority === true }
    );
    
    return res.status(200).json({
      success: true,
      data: result,
      message: 'Broadcast message sent successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get WebSocket server statistics
 * Admin only
 */
exports.getStats = async (req, res, next) => {
  try {
    const stats = await websocketService.getServerStats();
    
    return res.status(200).json({
      success: true,
      data: stats,
      message: 'WebSocket server statistics retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
}; 