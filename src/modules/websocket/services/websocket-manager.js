/**
 * WebSocket Manager
 * 
 * Manages WebSocket connections and implements the enhanced WebSocket protocol
 * with features like message acknowledgment, compression, and offline message delivery.
 */
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const zlib = require('zlib');
const config = require('../../../config');
const logger = require('../../../shared/utils/logger');
const messageService = require('./message.service');
const connectionService = require('./connection.service');
const { WebSocketError } = require('../../../shared/errors');
const { promisify } = require('util');

// Promisify zlib methods
const deflateAsync = promisify(zlib.deflate);
const inflateAsync = promisify(zlib.inflate);

class WebSocketManager {
  constructor(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: config.websocket.path || '/ws',
      maxPayload: config.websocket.maxPayloadSize || 1024 * 1024 // 1MB default
    });
    
    this.messageHandlers = new Map();
    this.setupDefaultHandlers();
    this.setupHeartbeat();
    
    // Track server stats
    this.stats = {
      totalConnections: 0,
      activeConnections: 0,
      messagesReceived: 0,
      messagesSent: 0,
      errors: 0,
      lastResetTime: new Date()
    };
    
    // Initialize the WebSocket server
    this.init();
  }
  
  /**
   * Initialize the WebSocket server
   */
  init() {
    this.wss.on('connection', this.handleConnection.bind(this));
    this.wss.on('error', this.handleServerError.bind(this));
    
    logger.info(`WebSocket server initialized at ${config.websocket.path || '/ws'}`);
  }
  
  /**
   * Set up default message handlers
   */
  setupDefaultHandlers() {
    this.registerMessageHandler('ping', this.handlePing.bind(this));
    this.registerMessageHandler('ack', this.handleAcknowledgment.bind(this));
    this.registerMessageHandler('compress', this.toggleCompression.bind(this));
  }
  
  /**
   * Set up heartbeat interval to detect dead connections
   */
  setupHeartbeat() {
    const interval = config.websocket.heartbeatInterval || 30000; // 30 seconds default
    
    setInterval(() => {
      this.wss.clients.forEach(ws => {
        if (ws.isAlive === false) {
          logger.debug(`Terminating inactive connection: ${ws.connectionId}`);
          return ws.terminate();
        }
        
        ws.isAlive = false;
        ws.ping();
      });
    }, interval);
  }
  
  /**
   * Register a message handler
   * 
   * @param {string} messageType - Type of message to handle
   * @param {Function} handler - Handler function
   */
  registerMessageHandler(messageType, handler) {
    this.messageHandlers.set(messageType, handler);
  }
  
  /**
   * Handle new WebSocket connection
   * 
   * @param {WebSocket} ws - WebSocket connection
   * @param {Object} req - HTTP request object
   */
  handleConnection(ws, req) {
    // Generate connection ID
    ws.connectionId = uuidv4();
    ws.isAlive = true;
    
    // Set default connection properties
    ws.useCompression = false;
    ws.requireAcks = false;
    
    // Update stats
    this.stats.totalConnections++;
    this.stats.activeConnections++;
    
    // Set up connection event handlers
    ws.on('message', (data) => this.handleClientMessage(ws, data));
    ws.on('close', () => this.handleDisconnect(ws));
    ws.on('error', (error) => this.handleClientError(ws, error));
    ws.on('pong', () => { ws.isAlive = true; });
    
    // Log connection
    logger.info(`New WebSocket connection: ${ws.connectionId}`, {
      ip: req.socket.remoteAddress,
      headers: req.headers
    });
    
    // Send welcome message
    this.sendToClient(ws, 'welcome', {
      connectionId: ws.connectionId,
      serverTime: new Date().toISOString(),
      features: {
        compression: true,
        acknowledgment: true,
        offlineMessages: true
      }
    });
  }
}

module.exports = WebSocketManager; 