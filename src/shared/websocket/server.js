/**
 * WebSocket server implementation with enhanced security
 * 
 * Security features:
 * - JWT token validation for all connections
 * - Connection rejection for invalid tokens with appropriate status codes
 * - User-specific channel authorization
 * - Rate limiting for WebSocket messages
 * - Proper connection close handling with status codes
 * - Connection tracking and monitoring
 * - Channel-based messaging for secure message routing
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
 * WebSocket close codes (RFC 6455)
 * Reference: https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent/code
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
  SERVICE_RESTART: 1012,
  TRY_AGAIN_LATER: 1013,
  
  // Custom codes (4000-4999)
  AUTHENTICATION_FAILED: 4001,
  AUTHORIZATION_FAILED: 4003,
  RATE_LIMITED: 4029,
  INVALID_MESSAGE: 4400
};

/**
 * Set up WebSocket server with enhanced security
 * @param {http.Server} server - HTTP server instance
 * @param {Object} options - Configuration options
 * @returns {WebSocket.Server} WebSocket server instance
 */
const setupWebSocketServer = (server, options = {}) => {
  const {
    validateToken,
    authorizeChannelAccess,
    rateLimiter,
    path = '/api/v1/ws',
    maxPayloadSize = 1024 * 1024, // 1MB default
    heartbeatIntervalMs = 30000 // 30 seconds default
  } = options;
  
  // Create WS server with security options
  const wss = new WebSocket.Server({ 
    noServer: true,
    maxPayload: maxPayloadSize
  });
  
  // Track subscribed channels for each connection
  const channelSubscriptions = new Map();
  
  // Track message counts for rate limiting
  const messageCounters = new Map();
  
  /**
   * Subscribe connection to channel
   * @param {String} connectionId - Connection ID
   * @param {String} channel - Channel name
   * @returns {Boolean} Success status
   */
  wss.subscribeToChannel = (connectionId, channel) => {
    if (!channelSubscriptions.has(connectionId)) {
      channelSubscriptions.set(connectionId, new Set());
    }
    
    channelSubscriptions.get(connectionId).add(channel);
    return true;
  };
  
  /**
   * Unsubscribe connection from channel
   * @param {String} connectionId - Connection ID
   * @param {String} channel - Channel name
   * @returns {Boolean} Success status
   */
  wss.unsubscribeFromChannel = (connectionId, channel) => {
    if (!channelSubscriptions.has(connectionId)) {
      return false;
    }
    
    return channelSubscriptions.get(connectionId).delete(channel);
  };
  
  /**
   * Broadcast message to all clients subscribed to specific channel
   * @param {String} channel - Target channel
   * @param {Object} message - Message to broadcast
   * @param {Boolean} isPriority - Whether message is high priority
   * @returns {Promise<Boolean>} Success status
   */
  wss.broadcastToChannel = async (channel, message, isPriority = false) => {
    try {
      const messageStr = JSON.stringify(message);
      let sentCount = 0;
      
      wss.clients.forEach((client) => {
        if (
          client.readyState === WebSocket.OPEN && 
          client.connectionId &&
          channelSubscriptions.has(client.connectionId) && 
          channelSubscriptions.get(client.connectionId).has(channel)
        ) {
          // For high priority messages, attempt to send even if client appears busy
          if (isPriority || !client.isSendingMessage) {
            client.isSendingMessage = true;
            client.send(messageStr, (err) => {
              client.isSendingMessage = false;
              if (err) {
                logger.warn(`Failed to send message to client: ${err.message}`, {
                  connectionId: client.connectionId,
                  userId: client.userId,
                  channel
                });
              } else {
                sentCount++;
              }
            });
          }
        }
      });
      
      return true;
    } catch (error) {
      logger.error(`Broadcasting to channel ${channel} failed: ${error.message}`);
      return false;
    }
  };
  
  /**
   * Broadcast message to all connected clients (admin only)
   * @param {Object} message - Message to broadcast
   * @returns {Promise<Number>} Number of clients message was sent to
   */
  wss.broadcast = async (message) => {
    try {
      const messageStr = JSON.stringify(message);
      let sentCount = 0;
      
      const sendPromises = Array.from(wss.clients)
        .filter(client => client.readyState === WebSocket.OPEN)
        .map(client => {
          return new Promise(resolve => {
            client.send(messageStr, (err) => {
              if (!err) sentCount++;
              resolve();
            });
          });
        });
      
      await Promise.all(sendPromises);
      return sentCount;
    } catch (error) {
      logger.error(`Global broadcast failed: ${error.message}`);
      return 0;
    }
  };
  
  /**
   * Check if client is exceeding rate limits
   * @param {String} connectionId - Connection ID
   * @returns {Boolean} Whether rate limit is exceeded
   */
  const checkRateLimit = (connectionId) => {
    if (!rateLimiter) return false;
    
    const isLimited = rateLimiter.isRateLimited(connectionId);
    if (isLimited) {
      logger.warn(`Rate limit exceeded for connection ${connectionId}`);
    }
    
    return isLimited;
  };
  
  /**
   * Track message for rate limiting
   * @param {String} connectionId - Connection ID
   */
  const trackMessage = (connectionId) => {
    if (!rateLimiter) return;
    
    rateLimiter.trackRequest(connectionId);
  };
  
  /**
   * Send error message to client
   * @param {WebSocket} ws - WebSocket connection
   * @param {String} message - Error message
   * @param {String} code - Error code
   */
  const sendErrorMessage = (ws, message, code) => {
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
  const heartbeatTimer = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }
      
      ws.isAlive = false;
      ws.ping();
    });
  }, heartbeatIntervalMs);
  
  // Clean up interval on server close
  wss.on('close', () => {
    clearInterval(heartbeatTimer);
    logger.info('WebSocket server closed');
  });
  
  // Handle HTTP upgrade requests to upgrade to WebSocket
  server.on('upgrade', async (request, socket, head) => {
    try {
      const { pathname, query } = url.parse(request.url, true);
      
      // Only handle WebSocket connections to configured path
      if (pathname === path) {
        try {
          // Extract token from query parameter
          const token = query.token;
          
          // Validate the token
          if (!token) {
            logger.warn('WebSocket connection attempt without token');
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
            return;
          }
          
          // Authenticate the connection
          const user = await validateToken(token);
          
          // Extract client info for tracking
          const clientInfo = {
            ip: request.headers['x-forwarded-for'] || request.socket.remoteAddress,
            userAgent: request.headers['user-agent'] || 'Unknown',
            acceptLanguage: request.headers['accept-language'] || 'en-US'
          };
          
          // Upgrade the connection
          wss.handleUpgrade(request, socket, head, async (ws) => {
            try {
              // Create a unique connection ID
              const connectionId = require('crypto').randomUUID();
              
              // Store connection info on ws object
              ws.userId = user.sub;
              ws.connectionId = connectionId;
              ws.isAlive = true;
              ws.isSendingMessage = false;
              ws.userInfo = {
                userId: user.sub,
                role: user.role,
                iat: user.iat
              };
              
              // Create default channel subscriptions
              channelSubscriptions.set(connectionId, new Set([
                'public:announcements',
                `user:${user.sub}`
              ]));
              
              // Initialize message counter for rate limiting
              if (rateLimiter) {
                rateLimiter.registerClient(connectionId);
              }
              
              // Set up WebSocket event handlers
              ws.on('pong', () => {
                ws.isAlive = true;
              });
              
              ws.on('message', async (data) => {
                try {
                  // Check rate limit
                  if (checkRateLimit(connectionId)) {
                    sendErrorMessage(ws, 'Too many messages, please slow down', 'RATE_LIMITED');
                    return;
                  }
                  
                  // Track message for rate limiting
                  trackMessage(connectionId);
                  
                  // Parse message (safely)
                  let parsedMessage;
                  try {
                    parsedMessage = JSON.parse(data.toString());
                  } catch (error) {
                    sendErrorMessage(ws, 'Invalid message format', 'INVALID_MESSAGE');
                    return;
                  }
                  
                  // Handle subscription requests
                  if (parsedMessage.type === 'subscribe' && parsedMessage.channel) {
                    const channel = parsedMessage.channel;
                    
                    // Check authorization
                    const isAuthorized = await authorizeChannelAccess(user.sub, channel);
                    
                    if (!isAuthorized) {
                      logger.warn(`Unauthorized channel subscription attempt: ${channel}`, {
                        userId: user.sub,
                        connectionId,
                        channel
                      });
                      
                      sendErrorMessage(ws, 'Not authorized to subscribe to this channel', 'AUTHORIZATION_FAILED');
                      return;
                    }
                    
                    // Add subscription
                    wss.subscribeToChannel(connectionId, channel);
                    
                    // Send confirmation
                    ws.send(JSON.stringify({
                      type: 'subscribe:success',
                      payload: {
                        channel,
                        timestamp: new Date().toISOString()
                      }
                    }));
                    
                    return;
                  }
                  
                  // Handle unsubscribe requests
                  if (parsedMessage.type === 'unsubscribe' && parsedMessage.channel) {
                    const channel = parsedMessage.channel;
                    
                    // Remove subscription
                    wss.unsubscribeFromChannel(connectionId, channel);
                    
                    // Send confirmation
                    ws.send(JSON.stringify({
                      type: 'unsubscribe:success',
                      payload: {
                        channel,
                        timestamp: new Date().toISOString()
                      }
                    }));
                    
                    return;
                  }
                  
                  // Handle other message types through the message service
                  if (typeof options.handleMessage === 'function') {
                    await options.handleMessage(ws, data);
                  }
                } catch (error) {
                  logger.error(`Error handling WebSocket message: ${error.message}`, {
                    userId: user.sub,
                    connectionId
                  });
                  
                  sendErrorMessage(ws, 'Failed to process message', 'INTERNAL_ERROR');
                }
              });
              
              ws.on('close', (code, reason) => {
                // Clean up resources
                channelSubscriptions.delete(connectionId);
                
                if (rateLimiter) {
                  rateLimiter.unregisterClient(connectionId);
                }
                
                // Log the disconnection with reason
                logger.debug(`WebSocket connection closed`, {
                  userId: user.sub,
                  connectionId,
                  code,
                  reason: reason.toString()
                });
                
                // Call external handler if provided
                if (typeof options.handleDisconnect === 'function') {
                  options.handleDisconnect(connectionId, user.sub, code, reason.toString());
                }
              });
              
              ws.on('error', (error) => {
                logger.error(`WebSocket error: ${error.message}`, {
                  userId: user.sub,
                  connectionId
                });
              });
              
              // Complete the connection
              wss.emit('connection', ws);
              
              // Send welcome message
              ws.send(JSON.stringify({
                type: 'connection:established',
                payload: {
                  connectionId,
                  userId: user.sub,
                  channels: Array.from(channelSubscriptions.get(connectionId)),
                  timestamp: new Date().toISOString()
                }
              }));
              
              // Log successful connection
              logger.info(`WebSocket connection established`, {
                userId: user.sub,
                connectionId,
                ip: clientInfo.ip
              });
              
              // Call external connection handler if provided
              if (typeof options.handleConnection === 'function') {
                options.handleConnection(ws, user, clientInfo);
              }
            } catch (error) {
              logger.error(`Failed to setup WebSocket connection: ${error.message}`);
              ws.close(WS_CLOSE_CODES.INTERNAL_ERROR, 'Internal server error');
            }
          });
        } catch (error) {
          // Handle different authentication errors with appropriate status codes
          let statusCode = '401 Unauthorized';
          let closeCode = WS_CLOSE_CODES.AUTHENTICATION_FAILED;
          
          if (error.name === 'TokenExpiredError') {
            statusCode = '401 Token Expired';
          } else if (error.name === 'JsonWebTokenError') {
            statusCode = '401 Invalid Token';
          }
          
          logger.warn(`WebSocket authentication failed: ${error.message}`, {
            ip: request.headers['x-forwarded-for'] || request.socket.remoteAddress,
            error: error.name
          });
          
          socket.write(`HTTP/1.1 ${statusCode}\r\n\r\n`);
          socket.destroy();
        }
      } else {
        // Reject connections to other paths
        socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
        socket.destroy();
      }
    } catch (error) {
      logger.error(`WebSocket upgrade error: ${error.message}`);
      socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
      socket.destroy();
    }
  });
  
  return wss;
};

module.exports = { 
  setupWebSocketServer,
  WS_CLOSE_CODES
}; 