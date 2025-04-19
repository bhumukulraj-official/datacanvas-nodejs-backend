/**
 * WebSocket server implementation
 * Handles WebSocket connections, authentication, messages, and notifications
 */
const WebSocket = require('ws');
const http = require('http');
const url = require('url');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const { WebSocketError } = require('../errors');
const logger = require('../utils/logger');
const config = require('../config');
const WebSocketConnection = require('../../modules/websocket/models/WebSocketConnection');
const WebSocketMessage = require('../../modules/websocket/models/WebSocketMessage');

// Connection tracking
const activeConnections = new Map();

/**
 * Set up WebSocket server
 * @param {http.Server} server - HTTP server instance
 * @returns {WebSocket.Server} WebSocket server instance
 */
const setupWebSocketServer = (server) => {
  // Create WS server with noServer option
  const wss = new WebSocket.Server({ noServer: true });

  /**
   * Broadcast message to all connected clients or specific user
   * @param {Object} message - Message to broadcast
   * @param {String} [userId] - Optional user ID to target specific user
   */
  wss.broadcast = (message, userId = null) => {
    const messageStr = JSON.stringify(message);
    
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        // If userId is provided, only send to that user's connections
        if (!userId || client.userId === userId) {
          client.send(messageStr);
        }
      }
    });
  };

  /**
   * Handle new WebSocket connection
   * @param {WebSocket} ws - WebSocket connection
   * @param {Object} user - Authenticated user
   * @param {Object} clientInfo - Client information
   */
  const handleConnection = async (ws, user, clientInfo) => {
    try {
      // Generate unique connection ID
      const connectionId = uuidv4();
      
      // Store user info with connection
      ws.userId = user.sub;
      ws.connectionId = connectionId;
      
      // Track connection in database
      const connection = await WebSocketConnection.create({
        connection_id: connectionId,
        user_id: user.sub,
        client_ip: clientInfo.ip,
        user_agent: clientInfo.userAgent,
        connected_at: new Date(),
        is_active: true
      });
      
      // Add to active connections map
      activeConnections.set(connectionId, {
        ws,
        userId: user.sub,
        connectionId,
        connectedAt: new Date(),
        clientInfo
      });
      
      // Log connection
      logger.info(`WebSocket connection established for user ${user.sub}`, {
        userId: user.sub,
        connectionId,
        ip: clientInfo.ip
      });
      
      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connection:established',
        payload: {
          connectionId,
          status: 'connected',
          message: 'Connection established successfully',
          timestamp: new Date().toISOString()
        }
      }));
      
      // Set up heartbeat to detect connection drops
      ws.isAlive = true;
      ws.on('pong', () => {
        ws.isAlive = true;
      });
      
      // Handle incoming messages
      ws.on('message', (data) => handleMessage(ws, data));
      
      // Handle connection close
      ws.on('close', () => handleDisconnect(connectionId, user.sub));
      
      // Handle errors
      ws.on('error', (error) => {
        logger.error(`WebSocket error for user ${user.sub}`, { 
          userId: user.sub, 
          connectionId,
          error: error.message 
        });
      });
    } catch (error) {
      logger.error(`Failed to handle WebSocket connection: ${error.message}`);
      ws.terminate();
    }
  };

  /**
   * Handle WebSocket messages
   * @param {WebSocket} ws - WebSocket connection
   * @param {String|Buffer} data - Message data
   */
  const handleMessage = async (ws, data) => {
    try {
      // Parse message
      const message = JSON.parse(data.toString());
      
      // Validate message format
      if (!message.type || !message.payload) {
        return sendError(ws, 'Invalid message format', 'WS_002');
      }
      
      // Store message in database for persistence
      await WebSocketMessage.create({
        connection_id: ws.connectionId,
        user_id: ws.userId,
        message_type: message.type,
        message_data: JSON.stringify(message.payload),
        created_at: new Date()
      });
      
      // Handle different message types
      switch (message.type) {
        case 'ping':
          // Handle ping message
          ws.send(JSON.stringify({
            type: 'pong',
            payload: { timestamp: new Date().toISOString() }
          }));
          break;
          
        case 'notification:ack':
          // Handle notification acknowledgment
          // Implementation would go here
          break;
          
        default:
          // Handle custom messages by emitting events
          // This could integrate with an event emitter system
          logger.debug(`Received message of type ${message.type}`, {
            userId: ws.userId,
            connectionId: ws.connectionId,
            messageType: message.type
          });
      }
    } catch (error) {
      logger.error(`Error handling WebSocket message: ${error.message}`);
      sendError(ws, 'Failed to process message', 'WS_003');
    }
  };

  /**
   * Handle WebSocket disconnection
   * @param {String} connectionId - Connection ID
   * @param {String} userId - User ID
   */
  const handleDisconnect = async (connectionId, userId) => {
    try {
      // Update connection status in database
      await WebSocketConnection.update(
        { is_active: false, disconnected_at: new Date() },
        { where: { connection_id: connectionId } }
      );
      
      // Remove from active connections
      activeConnections.delete(connectionId);
      
      // Log disconnection
      logger.info(`WebSocket connection closed for user ${userId}`, {
        userId,
        connectionId
      });
    } catch (error) {
      logger.error(`Error handling WebSocket disconnect: ${error.message}`);
    }
  };

  /**
   * Send error message to client
   * @param {WebSocket} ws - WebSocket connection
   * @param {String} message - Error message
   * @param {String} code - Error code
   */
  const sendError = (ws, message, code = 'WS_001') => {
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
      logger.error(`Failed to send error message: ${error.message}`);
    }
  };

  // Set up heartbeat interval to detect dead connections
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        // Connection is dead, terminate it
        return ws.terminate();
      }
      
      // Mark as not alive, will be marked alive when pong is received
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000); // 30 seconds interval

  // Clean up interval on server close
  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  // Handle HTTP upgrade requests to upgrade to WebSocket
  server.on('upgrade', async (request, socket, head) => {
    const { pathname, query } = url.parse(request.url, true);
    
    // Only handle WebSocket connections to specific path
    if (pathname === '/api/v1/ws') {
      try {
        // Verify token from query parameter
        const token = query.token;
        if (!token) {
          socket.destroy();
          return;
        }
        
        // Validate JWT token
        let user;
        try {
          user = jwt.verify(token, config.jwt.secret);
        } catch (error) {
          logger.error(`WebSocket authentication failed: ${error.message}`);
          socket.destroy();
          return;
        }
        
        // Extract client info
        const clientInfo = {
          ip: request.headers['x-forwarded-for'] || request.connection.remoteAddress,
          userAgent: request.headers['user-agent'] || '',
          acceptLanguage: request.headers['accept-language'] || ''
        };
        
        // Authenticate the connection
        wss.handleUpgrade(request, socket, head, (ws) => {
          // Complete the connection
          wss.emit('connection', ws);
          
          // Handle the connection with authenticated user
          handleConnection(ws, user, clientInfo);
        });
      } catch (error) {
        logger.error(`Failed to upgrade WebSocket connection: ${error.message}`);
        socket.destroy();
      }
    } else {
      // Not a WebSocket endpoint, destroy the connection
      socket.destroy();
    }
  });

  return wss;
};

module.exports = { setupWebSocketServer }; 