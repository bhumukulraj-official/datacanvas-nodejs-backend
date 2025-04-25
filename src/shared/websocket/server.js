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
 * - Message compression for efficient data transfer
 */
const WebSocket = require('ws');
const http = require('http');
const url = require('url');
const zlib = require('zlib');
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
    heartbeatIntervalMs = 30000, // 30 seconds default
    perMessageDeflate = true // Enable compression by default
  } = options;
  
  // Create WS server with security options and compression
  const wss = new WebSocket.Server({ 
    noServer: true,
    maxPayload: maxPayloadSize,
    perMessageDeflate: perMessageDeflate ? {
      zlibDeflateOptions: {
        // See zlib defaults: https://nodejs.org/api/zlib.html
        chunkSize: 1024,
        memLevel: 7,
        level: 3
      },
      zlibInflateOptions: {
        chunkSize: 10 * 1024
      },
      // Other options
      serverNoContextTakeover: true, // Disable context takeover for the server
      clientNoContextTakeover: true, // Disable context takeover for the client
      serverMaxWindowBits: 10, // Reduce server memory allocation
      // Below options specified by the WebSocket protocol
      concurrencyLimit: 10, // Limits zlib concurrency for performance
      threshold: 1024 // Size below which messages should not be compressed
    } : false
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
   * Compress message if it's large enough
   * @param {Object|String} message - Message to compress
   * @returns {Promise<Buffer|String>} Compressed message or original if small
   */
  wss.compressMessage = async (message) => {
    try {
      if (!perMessageDeflate) {
        return typeof message === 'string' ? message : JSON.stringify(message);
      }
      
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
      
      // Don't compress small messages
      if (messageStr.length < 1024) {
        return messageStr;
      }
      
      return new Promise((resolve, reject) => {
        zlib.deflate(messageStr, { level: 3 }, (err, buffer) => {
          if (err) {
            logger.warn(`Message compression failed: ${err.message}`);
            resolve(messageStr); // Fallback to uncompressed
          } else {
            resolve(buffer);
          }
        });
      });
    } catch (error) {
      logger.error(`Message compression error: ${error.message}`);
      return typeof message === 'string' ? message : JSON.stringify(message);
    }
  };
  
  /**
   * Broadcast message to all clients subscribed to specific channel with compression
   * @param {String} channel - Target channel
   * @param {Object} message - Message to broadcast
   * @param {Boolean} isPriority - Whether message is high priority
   * @returns {Promise<Boolean>} Success status
   */
  wss.broadcastToChannel = async (channel, message, isPriority = false) => {
    try {
      const messageData = await wss.compressMessage(message);
      let sentCount = 0;
      
      // Add compression flag if message was compressed
      const isCompressed = Buffer.isBuffer(messageData);
      
      const sendPromises = [];
      
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
            
            // Set compression flag if client supports it
            const options = isCompressed && client.supportsCompression ? 
              { compress: true, binary: true } : undefined;
            
            const sendPromise = new Promise(resolve => {
              client.send(messageData, options, (err) => {
                client.isSendingMessage = false;
                if (err) {
                  logger.warn(`Failed to send message to client: ${err.message}`, {
                    connectionId: client.connectionId,
                    userId: client.userId,
                    channel
                  });
                  resolve(false);
                } else {
                  sentCount++;
                  resolve(true);
                }
              });
            });
            
            sendPromises.push(sendPromise);
          }
        }
      });
      
      // Wait for all messages to be sent
      await Promise.all(sendPromises);
      
      return sentCount > 0;
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
   * @param {Number} code - Status code
   * @private
   */
  const sendErrorMessage = (ws, message, code) => {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({
          type: 'error',
          error: {
            message,
            code
          },
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        logger.error(`Failed to send error message: ${error.message}`);
      }
    }
  };
  
  /**
   * Validate client IP address against blocklist
   * @param {String} ip - Client IP address
   * @returns {Boolean} Whether IP is allowed
   */
  const validateIpAddress = (ip) => {
    // Implementation would check against a blocklist or rate limit by IP
    // This is a simplified example
    return true;
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
    const pathname = url.parse(request.url).pathname;
    
    // Only handle WebSocket connections on the configured path
    if (pathname !== path) {
      socket.destroy();
      return;
    }
    
    // Get client IP
    const ip = request.headers['x-forwarded-for'] || 
      request.connection.remoteAddress;
    
    // Validate IP address
    if (!validateIpAddress(ip)) {
      socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
      socket.destroy();
      return;
    }
    
    // Parse query parameters to get token
    const { query } = url.parse(request.url, true);
    
    const supportsCompression = request.headers['sec-websocket-extensions'] && 
      request.headers['sec-websocket-extensions'].includes('permessage-deflate');
      
    try {
      // Validate token
      const user = await validateToken(query.token);
      
      // Authenticate WebSocket connection
      wss.handleUpgrade(request, socket, head, (ws) => {
        // Generate unique connection ID
        const connectionId = `ws-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Set client properties
        ws.connectionId = connectionId;
        ws.userId = user.sub;
        ws.userRole = user.role;
        ws.isAlive = true;
        ws.isSendingMessage = false;
        ws.connectedAt = new Date();
        ws.lastActivityAt = new Date();
        ws.supportsCompression = supportsCompression;
        
        // Create client metadata
        const metadata = {
          userAgent: request.headers['user-agent'],
          ip,
          origin: request.headers.origin
        };
        
        // Subscribe to user's default channels
        const userChannel = `user:${user.sub}`;
        channelSubscriptions.set(connectionId, new Set([userChannel]));
        
        // Track message counts for rate limiting
        if (rateLimiter) {
          messageCounters.set(connectionId, 0);
        }
        
        // Setup ping/pong for connection health check
        const pingInterval = setInterval(() => {
          if (ws.readyState !== WebSocket.OPEN) {
            clearInterval(pingInterval);
            return;
          }
          
          if (!ws.isAlive) {
            clearInterval(pingInterval);
            ws.terminate();
            return;
          }
          
          ws.isAlive = false;
          ws.ping();
        }, heartbeatIntervalMs);
        
        // Handle WebSocket connection events
        ws.on('message', async (data) => {
          ws.lastActivityAt = new Date();
          ws.isAlive = true;
          
          // Check rate limit
          if (checkRateLimit(connectionId)) {
            sendErrorMessage(ws, 'Rate limit exceeded', WS_CLOSE_CODES.RATE_LIMITED);
            return;
          }
          
          // Track message for rate limiting
          trackMessage(connectionId);
          
          try {
            // Validate message format
            let message;
            try {
              message = JSON.parse(data.toString());
            } catch (error) {
              sendErrorMessage(ws, 'Invalid message format', WS_CLOSE_CODES.INVALID_DATA);
              return;
            }
            
            if (!message.type) {
              sendErrorMessage(ws, 'Message type is required', WS_CLOSE_CODES.INVALID_DATA);
              return;
            }
            
            // Handle message based on type
            switch (message.type) {
              case 'ping':
                // Client ping (different from WebSocket protocol ping)
                ws.send(JSON.stringify({
                  type: 'pong',
                  timestamp: new Date().toISOString()
                }));
                break;
                
              case 'subscribe':
                // Handle channel subscription
                if (!message.channel) {
                  sendErrorMessage(ws, 'Channel name is required', WS_CLOSE_CODES.INVALID_DATA);
                  return;
                }
                
                // Check if user has access to this channel
                const canAccess = await authorizeChannelAccess(user.sub, message.channel);
                if (!canAccess) {
                  sendErrorMessage(
                    ws, 
                    `Not authorized to subscribe to channel: ${message.channel}`, 
                    WS_CLOSE_CODES.AUTHORIZATION_FAILED
                  );
                  return;
                }
                
                // Subscribe to channel
                if (!channelSubscriptions.has(connectionId)) {
                  channelSubscriptions.set(connectionId, new Set());
                }
                
                channelSubscriptions.get(connectionId).add(message.channel);
                
                // Send confirmation
                ws.send(JSON.stringify({
                  type: 'subscribed',
                  channel: message.channel,
                  timestamp: new Date().toISOString()
                }));
                
                // Log subscription
                logger.debug(`Client ${connectionId} subscribed to channel ${message.channel}`);
                break;
                
              case 'unsubscribe':
                // Handle channel unsubscription
                if (!message.channel) {
                  sendErrorMessage(ws, 'Channel name is required', WS_CLOSE_CODES.INVALID_DATA);
                  return;
                }
                
                // Unsubscribe from channel
                if (channelSubscriptions.has(connectionId)) {
                  channelSubscriptions.get(connectionId).delete(message.channel);
                }
                
                // Send confirmation
                ws.send(JSON.stringify({
                  type: 'unsubscribed',
                  channel: message.channel,
                  timestamp: new Date().toISOString()
                }));
                
                // Log unsubscription
                logger.debug(`Client ${connectionId} unsubscribed from channel ${message.channel}`);
                break;
                
              default:
                // Log unknown message type
                logger.warn(`Unknown message type: ${message.type}`);
            }
          } catch (error) {
            logger.error(`Error handling WebSocket message: ${error.message}`, { error });
            sendErrorMessage(ws, 'Error processing message', WS_CLOSE_CODES.INTERNAL_ERROR);
          }
        });
        
        // Handle pong messages (response to ping)
        ws.on('pong', () => {
          ws.isAlive = true;
          ws.lastActivityAt = new Date();
        });
        
        // Handle connection close
        ws.on('close', async (code, reason) => {
          clearInterval(pingInterval);
          
          // Remove from channel subscriptions
          channelSubscriptions.delete(connectionId);
          
          // Remove from message counters
          if (messageCounters.has(connectionId)) {
            messageCounters.delete(connectionId);
          }
          
          // Track connection close in database
          try {
            await connectionService.updateConnection(connectionId, {
              status: 'disconnected',
              disconnectedAt: new Date(),
              disconnectReason: reason,
              disconnectCode: code
            });
          } catch (error) {
            logger.error(`Failed to update connection status: ${error.message}`, { connectionId });
          }
          
          logger.info(`WebSocket connection closed: ${connectionId}`, { 
            userId: user.sub, 
            code, 
            reason 
          });
        });
        
        // Handle errors
        ws.on('error', (error) => {
          logger.error(`WebSocket error: ${error.message}`, { 
            connectionId, 
            userId: user.sub 
          });
        });
        
        // Track connection in database
        connectionService.createConnection({
          connectionId,
          userId: user.sub,
          status: 'active',
          metadata: JSON.stringify(metadata),
          userAgent: request.headers['user-agent'],
          ipAddress: ip
        }).catch(error => {
          logger.error(`Failed to track connection: ${error.message}`, { connectionId });
        });
        
        // Emit connection event
        wss.emit('connection', ws, request);
        
        logger.info(`WebSocket connection established: ${connectionId}`, { 
          userId: user.sub 
        });
      });
    } catch (error) {
      logger.error(`WebSocket connection rejected: ${error.message}`, { ip });
      
      // Send HTTP error response
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
    }
  });
  
  /**
   * Get server statistics
   * @returns {Object} Server statistics
   */
  wss.getStats = () => {
    const stats = {
      connections: {
        total: wss.clients.size,
        byRole: {}
      },
      channels: {
        total: new Set([...channelSubscriptions.values()].flat()).size,
        byName: {}
      },
      memory: process.memoryUsage()
    };
    
    // Count connections by role
    wss.clients.forEach(client => {
      const role = client.userRole || 'anonymous';
      stats.connections.byRole[role] = (stats.connections.byRole[role] || 0) + 1;
    });
    
    // Count subscribers by channel
    channelSubscriptions.forEach(channels => {
      channels.forEach(channel => {
        if (!stats.channels.byName[channel]) {
          stats.channels.byName[channel] = 0;
        }
        stats.channels.byName[channel]++;
      });
    });
    
    return stats;
  };
  
  /**
   * Disconnect a specific client
   * @param {String} connectionId - Connection ID to disconnect
   * @param {String} reason - Reason for disconnection
   * @returns {Boolean} Whether client was disconnected
   */
  wss.disconnectClient = (connectionId, reason = 'Disconnected by server') => {
    let disconnected = false;
    
    wss.clients.forEach(client => {
      if (client.connectionId === connectionId) {
        client.close(1000, reason);
        disconnected = true;
      }
    });
    
    return disconnected;
  };
  
  // Log server start
  logger.info('WebSocket server created with security features enabled');
  
  return wss;
};

/**
 * Export WebSocket server setup function
 */
module.exports = {
  setupWebSocketServer
}; 