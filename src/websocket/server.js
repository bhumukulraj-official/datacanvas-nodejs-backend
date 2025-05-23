const WebSocket = require('ws');
const { authenticateWebsocket } = require('./middleware/authMiddleware');
const { handleMessage } = require('./handlers/messageHandler');
const { handleNotification } = require('./handlers/notificationHandler');
const { WebsocketService } = require('../services/messaging');
const logger = require('../utils/logger.util');
const { handleTypingIndicator } = require('./handlers/typingHandler');

class WebSocketServer {
  constructor(httpServer) {
    this.wss = new WebSocket.Server({ noServer: true });
    this.connections = new Map();
    
    httpServer.on('upgrade', (request, socket, head) => {
      authenticateWebsocket(request, (err, user) => {
        if (err || !user) {
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }

        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.handleConnection(ws, user, request);
        });
      });
    });

    this.setupEventHandlers();
  }

  handleConnection(ws, user, request) {
    const connectionId = request.headers['sec-websocket-key'];
    
    // Store connection
    this.connections.set(connectionId, { ws, user });
    
    // Track in database
    WebsocketService.trackConnection(user.id, connectionId);

    ws.on('close', () => this.handleClose(connectionId));
    ws.on('message', (data) => this.handleMessage(connectionId, data));
    
    logger.info(`WebSocket connected: ${connectionId}`);
  }

  setupEventHandlers() {
    this.wss.on('connection', (ws) => {
      ws.send(JSON.stringify({ type: 'connection_ack', status: 'connected' }));
    });
  }

  async handleMessage(connectionId, data) {
    try {
      const message = JSON.parse(data);
      const { user, ws } = this.connections.get(connectionId);
      
      // Log incoming message
      await WebsocketService.logIncomingMessage(connectionId, message);

      switch(message.type) {
        case 'message':
          await handleMessage(user, message, ws);
          break;
        case 'notification':
          await handleNotification(user, message, ws);
          break;
        case 'typing':
          await handleTypingIndicator(user, message, ws);
          break;
        default:
          ws.send(JSON.stringify({ 
            error: 'Unsupported message type',
            type: message.type 
          }));
      }
    } catch (error) {
      logger.error('WebSocket message error:', error);
    }
  }

  handleClose(connectionId) {
    const connection = this.connections.get(connectionId);
    if (connection) {
      WebsocketService.handleDisconnect(connectionId);
      this.connections.delete(connectionId);
      logger.info(`WebSocket disconnected: ${connectionId}`);
    }
  }

  broadcastToUser(userId, message) {
    this.connections.forEach(({ ws, user }) => {
      if (user.id === userId) {
        ws.send(JSON.stringify(message));
      }
    });
  }

  startHeartbeat() {
    setInterval(() => {
      this.connections.forEach(({ ws }, connectionId) => {
        if (!ws.isAlive) {
          this.handleClose(connectionId);
          return;
        }
        
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);

    this.wss.on('connection', (ws) => {
      ws.isAlive = true;
      ws.on('pong', () => ws.isAlive = true);
    });
  }
}

module.exports = WebSocketServer; 