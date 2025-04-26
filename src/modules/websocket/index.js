'use strict';

/**
 * WebSocket Module
 * 
 * Main export for WebSocket functionality
 */
const routes = require('./routes');
const WebSocketManager = require('./services/websocket-manager');
const websocketService = require('./services/websocket.service');
const connectionService = require('./services/connection.service');
const messageService = require('./services/message.service');

module.exports = {
  routes,
  WebSocketManager,
  websocketService,
  connectionService,
  messageService,
  registerWebSocketServer: (server, options) => new WebSocketManager(server, options)
}; 