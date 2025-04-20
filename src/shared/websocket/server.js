/**
 * WebSocket server implementation
 * Handles WebSocket connections, authentication, messages, and notifications
 */
const WebSocket = require('ws');
const http = require('http');
const url = require('url');
const { WebSocketError } = require('../errors');
const logger = require('../utils/logger');
const config = require('../config');
const connectionService = require('../../modules/websocket/services/connection.service');
const messageService = require('../../modules/websocket/services/message.service');
const notificationService = require('../../modules/websocket/services/notification.service');

/**
 * Set up WebSocket server
 * @param {http.Server} server - HTTP server instance
 * @returns {WebSocket.Server} WebSocket server instance
 */
const setupWebSocketServer = (server) => {
  // Create WS server with noServer option
  const wss = new WebSocket.Server({ 
    noServer: true,
    maxPayload: 1024 * 1024 // 1MB max message size
  });

  /**
   * Broadcast message to all connected clients or specific user
   * @param {Object} message - Message to broadcast
   * @param {String} [userId] - Optional user ID to target specific user
   */
  wss.broadcast = (message, userId = null) => {
    if (userId) {
      messageService.sendToUser(userId, message.type, message.payload);
    } else {
      messageService.broadcast(message.type, message.payload);
    }
  };

  // Set up heartbeat interval to detect dead connections
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!connectionService.isConnectionAlive(ws.connectionId)) {
        return ws.terminate();
      }
      
      connectionService.updateConnectionStatus(ws.connectionId, false);
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
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }
        
        // Authenticate the connection
        const user = await connectionService.authenticateConnection(token);
        
        // Extract client info
        const clientInfo = {
          ip: request.headers['x-forwarded-for'] || request.connection.remoteAddress,
          userAgent: request.headers['user-agent'] || '',
          acceptLanguage: request.headers['accept-language'] || ''
        };
        
        // Upgrade the connection
        wss.handleUpgrade(request, socket, head, async (ws) => {
          try {
            // Track the connection
            const connectionId = await connectionService.trackConnection(ws, user, clientInfo);
            
            // Store connection info on ws object
            ws.userId = user.sub;
            ws.connectionId = connectionId;
            ws.isAlive = true;
            
            // Set up WebSocket event handlers
            ws.on('pong', () => {
              connectionService.updateConnectionStatus(connectionId, true);
            });
            
            ws.on('message', (data) => {
              messageService.handleMessage(ws, data);
            });
            
            ws.on('close', () => {
              connectionService.handleDisconnect(connectionId, user.sub);
            });
            
            ws.on('error', (error) => {
              logger.error(`WebSocket error for user ${user.sub}:`, error);
            });
            
            // Complete the connection
            wss.emit('connection', ws);
            
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
          } catch (error) {
            logger.error('Failed to setup WebSocket connection:', error);
            ws.terminate();
          }
        });
      } catch (error) {
        logger.error('Failed to upgrade WebSocket connection:', error);
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
      }
    } else {
      socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
      socket.destroy();
    }
  });

  return wss;
};

module.exports = { setupWebSocketServer }; 