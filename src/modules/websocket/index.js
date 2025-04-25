/**
 * WebSocket Module
 * 
 * Main export for WebSocket functionality
 */
const WebSocketManager = require('./websocket-manager');
const websocketController = require('./websocket.controller');
const connectionService = require('./services/connection.service');
const messageService = require('./services/message.service');
const protocolService = require('./services/protocol.service');

module.exports = {
  WebSocketManager,
  controller: websocketController,
  connectionService,
  messageService,
  protocolService,
  
  // Export convenience methods
  registerServer: websocketController.registerWebSocketServer,
  router: websocketController.router
}; 