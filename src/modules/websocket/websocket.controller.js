/**
 * WebSocket Controller
 * 
 * Handles WebSocket endpoints and route registration.
 * Integrates WebSocketManager with Express/HTTP server.
 */
const express = require('express');
const WebSocketManager = require('./websocket-manager');
const connectionService = require('./services/connection.service');
const messageService = require('./services/message.service');
const protocolService = require('./services/protocol.service');
const authMiddleware = require('../../middleware/auth.middleware');
const logger = require('../../shared/utils/logger');

// Create router
const router = express.Router();

// Initialize WebSocket manager (will be set when registered)
let wsManager = null;

/**
 * Initialize and register the WebSocket server with an HTTP server
 * 
 * @param {http.Server} server - HTTP server instance
 * @param {Object} options - WebSocket options
 */
function registerWebSocketServer(server, options = {}) {
  // Create WebSocket manager
  wsManager = new WebSocketManager({
    server,
    path: options.path || '/ws',
    maxPayload: options.maxPayload || 1024 * 1024, // 1MB default
    ...options
  });
  
  // Set up event handlers
  setupEventHandlers();
  
  logger.info('WebSocket server registered', {
    path: wsManager.path,
    maxPayload: wsManager.maxPayload
  });
  
  return wsManager;
}

/**
 * Set up WebSocket event handlers
 */
function setupEventHandlers() {
  if (!wsManager) {
    throw new Error('WebSocket manager not initialized');
  }
  
  // Handle connection events
  wsManager.on('connection', handleConnection);
  wsManager.on('message', handleMessage);
  wsManager.on('close', handleClose);
  wsManager.on('error', handleError);
  
  // Register default message handlers
  registerMessageHandlers();
}

/**
 * Handle WebSocket connection
 * 
 * @param {WebSocket} ws - WebSocket connection
 * @param {Object} request - HTTP request
 */
function handleConnection(ws, request) {
  try {
    // Generate connection ID
    const connectionId = request.headers['sec-websocket-key'] || 
                        `conn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    // Extract connection metadata
    const metadata = {
      ip: request.socket.remoteAddress,
      userAgent: request.headers['user-agent'],
      origin: request.headers.origin
    };
    
    // Store connection
    connectionService.registerConnection(connectionId, null, metadata);
    
    // Set connection ID on WebSocket object
    ws.connectionId = connectionId;
    connectionService.updateConnectionSocket(connectionId, ws);
    
    // Send welcome message
    const welcomeMessage = protocolService.createSystemMessage('welcome', {
      connectionId,
      features: protocolService.PROTOCOL_FEATURES[protocolService.PROTOCOL_VERSIONS.V2],
      timestamp: Date.now()
    });
    
    ws.send(JSON.stringify(welcomeMessage));
    
    logger.debug(`WebSocket connection established: ${connectionId}`, {
      ip: metadata.ip,
      userAgent: metadata.userAgent
    });
  } catch (error) {
    logger.error('Error handling WebSocket connection', { error });
    ws.close(1011, 'Internal server error');
  }
}

/**
 * Handle WebSocket message
 * 
 * @param {WebSocket} ws - WebSocket connection
 * @param {string} message - Message data
 */
function handleMessage(ws, message) {
  try {
    // Parse message
    const parsedMessage = protocolService.parseMessage(message);
    
    // If message parsing failed, send error
    if (parsedMessage.error) {
      const errorMessage = protocolService.createErrorMessage(
        parsedMessage.code,
        parsedMessage.message
      );
      ws.send(JSON.stringify(errorMessage));
      return;
    }
    
    // Process message based on type
    const messageHandlers = wsManager.getMessageHandlers();
    const handler = messageHandlers[parsedMessage.type];
    
    if (handler && typeof handler === 'function') {
      handler(ws, parsedMessage);
    } else {
      // No handler found for this message type
      const errorMessage = protocolService.createErrorMessage(
        protocolService.ERROR_CODES.PROTOCOL_ERROR,
        `Unsupported message type: ${parsedMessage.type}`
      );
      ws.send(JSON.stringify(errorMessage));
    }
  } catch (error) {
    logger.error('Error handling WebSocket message', { error, message: message.substring(0, 100) });
    
    // Send error to client
    const errorMessage = protocolService.createErrorMessage(
      protocolService.ERROR_CODES.INTERNAL_ERROR,
      'Internal server error'
    );
    ws.send(JSON.stringify(errorMessage));
  }
}

/**
 * Handle WebSocket close
 * 
 * @param {WebSocket} ws - WebSocket connection
 * @param {number} code - Close code
 * @param {string} reason - Close reason
 */
function handleClose(ws, code, reason) {
  try {
    const connectionId = ws.connectionId;
    
    if (connectionId) {
      // Get connection information before removal
      const connection = connectionService.getConnection(connectionId);
      
      // Remove connection
      connectionService.removeConnection(connectionId);
      
      logger.debug(`WebSocket connection closed: ${connectionId}`, {
        code,
        reason,
        userId: connection ? connection.userId : null
      });
    }
  } catch (error) {
    logger.error('Error handling WebSocket close', { error });
  }
}

/**
 * Handle WebSocket error
 * 
 * @param {WebSocket} ws - WebSocket connection
 * @param {Error} error - Error object
 */
function handleError(ws, error) {
  logger.error('WebSocket error', {
    connectionId: ws.connectionId,
    error: error.message
  });
}

/**
 * Register default message handlers
 */
function registerMessageHandlers() {
  // Authentication message handler
  wsManager.registerMessageHandler('auth', handleAuthMessage);
  
  // Ping message handler
  wsManager.registerMessageHandler('ping', handlePingMessage);
  
  // Acknowledgment message handler
  wsManager.registerMessageHandler('ack', handleAckMessage);
  
  // Presence message handler
  wsManager.registerMessageHandler('presence', handlePresenceMessage);
}

/**
 * Handle authentication message
 * 
 * @param {WebSocket} ws - WebSocket connection
 * @param {Object} message - Parsed message
 */
function handleAuthMessage(ws, message) {
  // Authentication should include a token in payload
  const { token } = message.payload || {};
  
  if (!token) {
    const errorMessage = protocolService.createErrorMessage(
      protocolService.ERROR_CODES.AUTHENTICATION_FAILED,
      'Authentication token is required'
    );
    ws.send(JSON.stringify(errorMessage));
    return;
  }
  
  // Verify token (this would typically use your auth service)
  try {
    // This is a placeholder for actual token verification
    // Replace with your actual authentication logic
    const decoded = verifyAuthToken(token);
    
    if (!decoded || !decoded.userId) {
      const errorMessage = protocolService.createErrorMessage(
        protocolService.ERROR_CODES.AUTHENTICATION_FAILED,
        'Invalid authentication token'
      );
      ws.send(JSON.stringify(errorMessage));
      return;
    }
    
    // Update connection with user ID
    const connectionId = ws.connectionId;
    const connection = connectionService.getConnection(connectionId);
    
    if (!connection) {
      const errorMessage = protocolService.createErrorMessage(
        protocolService.ERROR_CODES.INTERNAL_ERROR,
        'Connection not found'
      );
      ws.send(JSON.stringify(errorMessage));
      return;
    }
    
    // Update connection with user ID
    connection.userId = decoded.userId;
    connection.isAuthenticated = true;
    connectionService.removeConnection(connectionId);
    connectionService.registerConnection(connectionId, decoded.userId, connection.metadata);
    connectionService.updateConnectionSocket(connectionId, ws);
    
    // Send success response
    const authSuccessMessage = protocolService.createSystemMessage('auth_success', {
      userId: decoded.userId,
      timestamp: Date.now()
    });
    ws.send(JSON.stringify(authSuccessMessage));
    
    // Check for offline messages
    deliverOfflineMessages(decoded.userId, ws);
    
    logger.debug(`WebSocket authenticated: ${connectionId}`, {
      userId: decoded.userId
    });
  } catch (error) {
    logger.error('Authentication error', { error });
    
    const errorMessage = protocolService.createErrorMessage(
      protocolService.ERROR_CODES.AUTHENTICATION_FAILED,
      'Authentication failed'
    );
    ws.send(JSON.stringify(errorMessage));
  }
}

/**
 * Verify authentication token
 * 
 * @param {string} token - Authentication token
 * @returns {Object|null} Decoded token or null if invalid
 */
function verifyAuthToken(token) {
  // This is a placeholder for actual token verification
  // In a real implementation, you would use JWT or another token verification method
  
  try {
    // For demonstration purposes only
    // IMPORTANT: Replace this with your actual authentication logic
    if (token && token.startsWith('Bearer ')) {
      // Simple dummy verification - not for production use
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        try {
          // Try to parse the middle part as base64-encoded JSON
          const payload = JSON.parse(
            Buffer.from(tokenParts[1], 'base64').toString()
          );
          
          return {
            userId: payload.sub || payload.userId,
            ...payload
          };
        } catch (e) {
          return null;
        }
      }
    }
    
    return null;
  } catch (error) {
    logger.error('Token verification error', { error });
    return null;
  }
}

/**
 * Deliver offline messages to a user
 * 
 * @param {string} userId - User ID
 * @param {WebSocket} ws - WebSocket connection
 */
function deliverOfflineMessages(userId, ws) {
  try {
    // Get offline messages
    const offlineMessages = messageService.getOfflineMessages(userId);
    
    if (offlineMessages.length === 0) {
      return;
    }
    
    logger.debug(`Delivering ${offlineMessages.length} offline messages to user ${userId}`);
    
    // Send each message
    offlineMessages.forEach(message => {
      try {
        // Create an envelope for offline message delivery
        const envelope = protocolService.createProtocolMessage(
          'message',
          message.payload,
          {
            id: message.id,
            timestamp: message.timestamp,
            metadata: {
              ...message.metadata,
              offlineDelivery: true,
              queuedAt: message.queuedAt
            }
          }
        );
        
        ws.send(messageService.serializeMessage(envelope, true));
      } catch (error) {
        logger.error(`Error sending offline message ${message.id}`, { error });
      }
    });
    
    // Clear offline messages after delivery
    messageService.clearOfflineMessages(userId);
  } catch (error) {
    logger.error('Error delivering offline messages', { error, userId });
  }
}

/**
 * Handle ping message
 * 
 * @param {WebSocket} ws - WebSocket connection
 * @param {Object} message - Parsed message
 */
function handlePingMessage(ws, message) {
  try {
    // Create pong response
    const pongMessage = protocolService.createProtocolMessage('pong', {
      echo: message.payload,
      timestamp: Date.now()
    });
    
    // Send pong
    ws.send(JSON.stringify(pongMessage));
    
    // Update last activity for connection
    if (ws.connectionId) {
      const connection = connectionService.getConnection(ws.connectionId);
      if (connection) {
        connection.lastActivityAt = new Date();
      }
    }
  } catch (error) {
    logger.error('Error handling ping message', { error });
  }
}

/**
 * Handle acknowledgment message
 * 
 * @param {WebSocket} ws - WebSocket connection
 * @param {Object} message - Parsed message
 */
function handleAckMessage(ws, message) {
  try {
    const { messageId } = message.payload || {};
    
    if (!messageId) {
      return;
    }
    
    // Process acknowledgment
    messageService.acknowledgeMessage(messageId, {
      timestamp: Date.now(),
      connectionId: ws.connectionId
    });
  } catch (error) {
    logger.error('Error handling ack message', { error });
  }
}

/**
 * Handle presence message
 * 
 * @param {WebSocket} ws - WebSocket connection
 * @param {Object} message - Parsed message
 */
function handlePresenceMessage(ws, message) {
  try {
    // Check if connection is authenticated
    if (!ws.connectionId) {
      const errorMessage = protocolService.createErrorMessage(
        protocolService.ERROR_CODES.AUTHENTICATION_FAILED,
        'Authentication required for presence updates'
      );
      ws.send(JSON.stringify(errorMessage));
      return;
    }
    
    const connection = connectionService.getConnection(ws.connectionId);
    if (!connection || !connection.userId) {
      const errorMessage = protocolService.createErrorMessage(
        protocolService.ERROR_CODES.AUTHENTICATION_FAILED,
        'Authentication required for presence updates'
      );
      ws.send(JSON.stringify(errorMessage));
      return;
    }
    
    // Update presence status (e.g., online, away, busy)
    const status = message.payload?.status || 'online';
    
    // Update connection metadata
    connectionService.updateConnectionMetadata(ws.connectionId, {
      presenceStatus: status,
      presenceUpdatedAt: Date.now()
    });
    
    // Acknowledge the presence update
    const ackMessage = protocolService.createAckMessage(message.id, {
      status: 'success'
    });
    ws.send(JSON.stringify(ackMessage));
  } catch (error) {
    logger.error('Error handling presence message', { error });
  }
}

/**
 * REST endpoint to get WebSocket server status
 */
router.get('/status', (req, res) => {
  try {
    if (!wsManager) {
      return res.status(503).json({
        status: 'error',
        message: 'WebSocket server not initialized'
      });
    }
    
    // Get server stats
    const serverStats = wsManager.getStats();
    const connectionStats = connectionService.getConnectionStats();
    const messageStats = messageService.getMessageStats();
    
    res.json({
      status: 'ok',
      server: serverStats,
      connections: connectionStats,
      messages: messageStats,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Error getting WebSocket status', { error });
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

/**
 * REST endpoint to get active connections
 */
router.get('/connections', authMiddleware.requireAdmin, (req, res) => {
  try {
    if (!wsManager) {
      return res.status(503).json({
        status: 'error',
        message: 'WebSocket server not initialized'
      });
    }
    
    // Get connection stats
    const connectionStats = connectionService.getConnectionStats();
    
    res.json({
      status: 'ok',
      connections: connectionStats,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Error getting WebSocket connections', { error });
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

/**
 * REST endpoint to send a message to a user
 */
router.post('/send', authMiddleware.requireAuth, (req, res) => {
  try {
    if (!wsManager) {
      return res.status(503).json({
        status: 'error',
        message: 'WebSocket server not initialized'
      });
    }
    
    const { userId, type, payload, options } = req.body;
    
    if (!userId || !type || !payload) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: userId, type, payload'
      });
    }
    
    // Create message
    const message = messageService.createMessage(type, payload, {
      sender: req.user.id,
      recipient: userId,
      ...options
    });
    
    // Send message
    const result = wsManager.sendToUser(userId, message);
    
    res.json({
      status: 'ok',
      result,
      messageId: message.id,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Error sending WebSocket message', { error });
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

/**
 * REST endpoint to broadcast a message to all users
 */
router.post('/broadcast', authMiddleware.requireAdmin, (req, res) => {
  try {
    if (!wsManager) {
      return res.status(503).json({
        status: 'error',
        message: 'WebSocket server not initialized'
      });
    }
    
    const { type, payload, options } = req.body;
    
    if (!type || !payload) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: type, payload'
      });
    }
    
    // Create message
    const message = messageService.createMessage(type, payload, {
      sender: req.user.id,
      ...options
    });
    
    // Broadcast message
    const result = wsManager.broadcast(message);
    
    res.json({
      status: 'ok',
      result,
      messageId: message.id,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Error broadcasting WebSocket message', { error });
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

module.exports = {
  router,
  registerWebSocketServer
}; 