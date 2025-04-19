/**
 * WebSocket client utility
 * Provides frontend client integration for WebSocket connections
 */

/**
 * WebSocket client with automatic reconnection
 */
class WebSocketClient {
  /**
   * Create a new WebSocket client
   * @param {Object} options - Configuration options
   * @param {String} options.baseUrl - Base URL for WebSocket connection
   * @param {String} options.token - Authentication token
   * @param {Number} options.reconnectInterval - Reconnection interval in ms (default: 2000)
   * @param {Number} options.maxReconnectAttempts - Max reconnection attempts (default: 10)
   * @param {Function} options.onOpen - Open event handler
   * @param {Function} options.onMessage - Message event handler
   * @param {Function} options.onClose - Close event handler
   * @param {Function} options.onError - Error event handler
   * @param {Function} options.onReconnect - Reconnect event handler
   */
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || window.location.origin.replace(/^http/, 'ws');
    this.token = options.token;
    this.reconnectInterval = options.reconnectInterval || 2000;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 10;
    
    // Event handlers
    this.onOpen = options.onOpen || (() => {});
    this.onMessage = options.onMessage || (() => {});
    this.onClose = options.onClose || (() => {});
    this.onError = options.onError || (() => {});
    this.onReconnect = options.onReconnect || (() => {});
    
    // Internal state
    this.socket = null;
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
    this.isConnecting = false;
    this.isConnected = false;
    this.isForceClosed = false;
    this.messageQueue = [];
    
    // Message ID counter
    this.messageIdCounter = 1;
    
    // Event listeners map for custom events
    this.eventListeners = new Map();
  }
  
  /**
   * Connect to WebSocket server
   * @returns {Promise} Resolves when connection is established
   */
  connect() {
    if (this.isConnecting) {
      return Promise.reject(new Error('WebSocket connection already in progress'));
    }
    
    if (this.isConnected) {
      return Promise.resolve();
    }
    
    this.isConnecting = true;
    this.isForceClosed = false;
    
    return new Promise((resolve, reject) => {
      try {
        // Create WebSocket URL with token
        const url = `${this.baseUrl}/api/v1/ws?token=${this.token}`;
        
        // Create WebSocket connection
        this.socket = new WebSocket(url);
        
        // Set up connection timeout
        const connectionTimeout = setTimeout(() => {
          if (!this.isConnected) {
            this.socket.close();
            this.isConnecting = false;
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000); // 10 seconds timeout
        
        // Connection established
        this.socket.onopen = (event) => {
          clearTimeout(connectionTimeout);
          this.isConnected = true;
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          
          // Process message queue
          this._processQueue();
          
          // Call onOpen handler
          this.onOpen(event);
          
          resolve();
        };
        
        // Message received
        this.socket.onmessage = (event) => {
          this._handleMessage(event);
        };
        
        // Connection closed
        this.socket.onclose = (event) => {
          clearTimeout(connectionTimeout);
          this.isConnected = false;
          this.isConnecting = false;
          
          // Call onClose handler
          this.onClose(event);
          
          // Attempt to reconnect unless connection was forcibly closed
          if (!this.isForceClosed) {
            this._reconnect();
          }
        };
        
        // Error occurred
        this.socket.onerror = (event) => {
          this.isConnecting = false;
          
          // Call onError handler
          this.onError(event);
          
          if (!this.isConnected) {
            clearTimeout(connectionTimeout);
            reject(new Error('WebSocket connection error'));
          }
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }
  
  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    if (!this.socket) {
      return;
    }
    
    // Mark as force closed to prevent reconnection
    this.isForceClosed = true;
    
    // Clear reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Close socket
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.close(1000, 'Client disconnected');
    }
    
    this.isConnected = false;
  }
  
  /**
   * Send message to WebSocket server
   * @param {String} type - Message type
   * @param {Object} payload - Message payload
   * @returns {Promise} Resolves when message is sent
   */
  send(type, payload = {}) {
    const messageId = this._generateMessageId();
    
    const message = {
      type,
      messageId,
      payload,
      timestamp: new Date().toISOString()
    };
    
    // If not connected, queue message
    if (!this.isConnected) {
      this.messageQueue.push(message);
      
      // Try to connect if not connecting
      if (!this.isConnecting && !this.isForceClosed) {
        this.connect();
      }
      
      return Promise.resolve(messageId);
    }
    
    // Send message
    try {
      this.socket.send(JSON.stringify(message));
      return Promise.resolve(messageId);
    } catch (error) {
      return Promise.reject(error);
    }
  }
  
  /**
   * Add event listener
   * @param {String} eventType - Event type to listen for
   * @param {Function} callback - Callback function
   */
  addEventListener(eventType, callback) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    
    this.eventListeners.get(eventType).push(callback);
  }
  
  /**
   * Remove event listener
   * @param {String} eventType - Event type
   * @param {Function} callback - Callback function to remove
   */
  removeEventListener(eventType, callback) {
    if (!this.eventListeners.has(eventType)) {
      return;
    }
    
    const listeners = this.eventListeners.get(eventType).filter(
      listener => listener !== callback
    );
    
    if (listeners.length) {
      this.eventListeners.set(eventType, listeners);
    } else {
      this.eventListeners.delete(eventType);
    }
  }
  
  /**
   * Process message queue
   * @private
   */
  _processQueue() {
    if (!this.isConnected || !this.messageQueue.length) {
      return;
    }
    
    // Process all queued messages
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      try {
        this.socket.send(JSON.stringify(message));
      } catch (error) {
        console.error('Failed to send queued message', error);
      }
    }
  }
  
  /**
   * Handle incoming message
   * @param {Event} event - WebSocket message event
   * @private
   */
  _handleMessage(event) {
    try {
      const message = JSON.parse(event.data);
      
      // Call onMessage handler
      this.onMessage(message);
      
      // Call specific event handler if exists
      if (message.type && this.eventListeners.has(message.type)) {
        this.eventListeners.get(message.type).forEach(callback => {
          try {
            callback(message.payload, message);
          } catch (error) {
            console.error(`Error in event listener for ${message.type}`, error);
          }
        });
      }
    } catch (error) {
      console.error('Error parsing WebSocket message', error);
    }
  }
  
  /**
   * Attempt to reconnect
   * @private
   */
  _reconnect() {
    if (this.isForceClosed || this.isConnecting || this.isConnected) {
      return;
    }
    
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`Maximum reconnection attempts (${this.maxReconnectAttempts}) reached`);
      return;
    }
    
    this.reconnectAttempts++;
    
    // Calculate backoff delay with exponential backoff (min 2s, max 30s)
    const delay = Math.min(
      30000,
      this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1)
    );
    
    // Call onReconnect handler
    this.onReconnect({
      attempt: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts,
      delay
    });
    
    // Set reconnect timer
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect().catch(() => {
        // If connection fails, _reconnect will be called by onclose handler
      });
    }, delay);
  }
  
  /**
   * Generate unique message ID
   * @returns {String} Unique message ID
   * @private
   */
  _generateMessageId() {
    const timestamp = Date.now();
    const counter = this.messageIdCounter++;
    
    return `${timestamp}-${counter}`;
  }
}

module.exports = WebSocketClient; 