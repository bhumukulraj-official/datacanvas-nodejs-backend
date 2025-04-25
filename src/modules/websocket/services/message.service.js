/**
 * WebSocket Message Service
 * 
 * Handles message operations including:
 * - Message formatting and validation
 * - Message delivery tracking and retries
 * - Message compression and serialization
 * - Offline message queue management
 */
const zlib = require('zlib');
const { v4: uuidv4 } = require('uuid');
const logger = require('../../../shared/utils/logger');

// In-memory message storage
const pendingMessages = new Map();
const offlineMessages = new Map();
const messageHistory = new Map();

// Default message settings
const DEFAULT_SETTINGS = {
  compressionThreshold: 1024, // bytes
  messageRetention: 86400000, // 24 hours in ms
  maxRetries: 3,
  retryInterval: 5000, // 5 seconds
  maxOfflineMessages: 100 // per user
};

/**
 * Create a new message object
 * 
 * @param {string} type - Message type
 * @param {any} payload - Message payload
 * @param {Object} options - Message options
 * @returns {Object} Message object
 */
function createMessage(type, payload, options = {}) {
  const messageId = options.id || uuidv4();
  const timestamp = options.timestamp || Date.now();
  
  const message = {
    id: messageId,
    type,
    payload,
    timestamp,
    sender: options.sender || null,
    recipient: options.recipient || null,
    requiresAck: options.requiresAck !== undefined ? options.requiresAck : true,
    compressed: false,
    metadata: options.metadata || {}
  };
  
  return message;
}

/**
 * Serialize message object to string
 * 
 * @param {Object} message - Message object
 * @param {boolean} compress - Whether to compress the message
 * @returns {string} Serialized message
 */
function serializeMessage(message, compress = false) {
  try {
    // Clone the message to avoid modifying the original
    const msgToSend = { ...message };
    
    // Check if compression should be applied
    const serialized = JSON.stringify(msgToSend);
    if (compress && serialized.length > DEFAULT_SETTINGS.compressionThreshold) {
      const compressed = zlib.deflateSync(serialized).toString('base64');
      msgToSend.compressed = true;
      msgToSend.payload = compressed;
    }
    
    return JSON.stringify(msgToSend);
  } catch (error) {
    logger.error(`Failed to serialize message: ${error.message}`, {
      messageId: message.id,
      error
    });
    throw error;
  }
}

/**
 * Deserialize message string to object
 * 
 * @param {string} messageString - Serialized message
 * @returns {Object} Deserialized message object
 */
function deserializeMessage(messageString) {
  try {
    const message = JSON.parse(messageString);
    
    // If message is compressed, decompress it
    if (message.compressed && typeof message.payload === 'string') {
      const decompressed = zlib.inflateSync(Buffer.from(message.payload, 'base64')).toString();
      message.payload = JSON.parse(decompressed);
      message.compressed = false;
    }
    
    return message;
  } catch (error) {
    logger.error(`Failed to deserialize message: ${error.message}`, {
      messageString: messageString.substring(0, 100) + (messageString.length > 100 ? '...' : ''),
      error
    });
    throw error;
  }
}

/**
 * Store a message as pending (waiting for acknowledgment)
 * 
 * @param {Object} message - Message object
 * @param {function} onAck - Callback for acknowledgment
 * @param {function} onTimeout - Callback for timeout
 * @returns {Object} Message with tracking information
 */
function trackMessage(message, onAck, onTimeout) {
  if (!message.id || !message.requiresAck) {
    return message;
  }
  
  const trackedMessage = {
    ...message,
    tracking: {
      sentAt: Date.now(),
      attempts: 1,
      maxRetries: DEFAULT_SETTINGS.maxRetries,
      timeoutId: null,
      onAck,
      onTimeout
    }
  };
  
  // Set timeout for acknowledgment
  trackedMessage.tracking.timeoutId = setTimeout(() => {
    handleMessageTimeout(message.id);
  }, DEFAULT_SETTINGS.retryInterval);
  
  // Store in pending messages
  pendingMessages.set(message.id, trackedMessage);
  
  return trackedMessage;
}

/**
 * Handle message timeout
 * 
 * @param {string} messageId - Message identifier
 */
function handleMessageTimeout(messageId) {
  if (!pendingMessages.has(messageId)) {
    return;
  }
  
  const message = pendingMessages.get(messageId);
  
  // Check if max retries reached
  if (message.tracking.attempts >= message.tracking.maxRetries) {
    // Call timeout callback if exists
    if (typeof message.tracking.onTimeout === 'function') {
      message.tracking.onTimeout(message);
    }
    
    // Remove from pending messages
    pendingMessages.delete(messageId);
    
    logger.warn(`Message delivery failed after ${message.tracking.attempts} attempts`, {
      messageId,
      recipient: message.recipient
    });
  } else {
    // Increment attempt count
    message.tracking.attempts += 1;
    
    // Call timeout callback for retry
    if (typeof message.tracking.onTimeout === 'function') {
      message.tracking.onTimeout(message, true); // true indicates retry is possible
    }
    
    // Reset timeout
    message.tracking.timeoutId = setTimeout(() => {
      handleMessageTimeout(messageId);
    }, DEFAULT_SETTINGS.retryInterval);
    
    logger.debug(`Message delivery retry ${message.tracking.attempts}/${message.tracking.maxRetries}`, {
      messageId,
      recipient: message.recipient
    });
  }
}

/**
 * Acknowledge message receipt
 * 
 * @param {string} messageId - Message identifier
 * @param {Object} ackData - Acknowledgment data
 * @returns {boolean} Success status
 */
function acknowledgeMessage(messageId, ackData = {}) {
  if (!messageId || !pendingMessages.has(messageId)) {
    return false;
  }
  
  const message = pendingMessages.get(messageId);
  
  // Clear timeout
  if (message.tracking.timeoutId) {
    clearTimeout(message.tracking.timeoutId);
  }
  
  // Call ack callback if exists
  if (typeof message.tracking.onAck === 'function') {
    message.tracking.onAck(message, ackData);
  }
  
  // Remove from pending messages
  pendingMessages.delete(messageId);
  
  // Add to message history
  addToMessageHistory(message, ackData);
  
  return true;
}

/**
 * Add message to history
 * 
 * @param {Object} message - Message object
 * @param {Object} ackData - Acknowledgment data
 */
function addToMessageHistory(message, ackData = {}) {
  const historyEntry = {
    ...message,
    acknowledged: true,
    acknowledgedAt: Date.now(),
    ackData
  };
  
  messageHistory.set(message.id, historyEntry);
  
  // Schedule cleanup
  setTimeout(() => {
    messageHistory.delete(message.id);
  }, DEFAULT_SETTINGS.messageRetention);
}

/**
 * Queue message for offline delivery
 * 
 * @param {string} userId - User identifier
 * @param {Object} message - Message object
 * @returns {boolean} Success status
 */
function queueOfflineMessage(userId, message) {
  if (!userId) {
    return false;
  }
  
  // Initialize user's queue if it doesn't exist
  if (!offlineMessages.has(userId)) {
    offlineMessages.set(userId, []);
  }
  
  const userQueue = offlineMessages.get(userId);
  
  // Check if queue is full
  if (userQueue.length >= DEFAULT_SETTINGS.maxOfflineMessages) {
    // Remove oldest message
    userQueue.shift();
  }
  
  // Add message to queue
  userQueue.push({
    ...message,
    queuedAt: Date.now()
  });
  
  logger.debug(`Queued offline message for user ${userId}`, {
    messageId: message.id,
    queueSize: userQueue.length
  });
  
  return true;
}

/**
 * Get offline messages for user
 * 
 * @param {string} userId - User identifier
 * @returns {Array} Array of queued messages
 */
function getOfflineMessages(userId) {
  if (!userId || !offlineMessages.has(userId)) {
    return [];
  }
  
  return [...offlineMessages.get(userId)];
}

/**
 * Clear offline messages for user
 * 
 * @param {string} userId - User identifier
 * @returns {number} Number of messages cleared
 */
function clearOfflineMessages(userId) {
  if (!userId || !offlineMessages.has(userId)) {
    return 0;
  }
  
  const count = offlineMessages.get(userId).length;
  offlineMessages.delete(userId);
  
  logger.debug(`Cleared ${count} offline messages for user ${userId}`);
  
  return count;
}

/**
 * Get message statistics
 * 
 * @returns {Object} Message statistics
 */
function getMessageStats() {
  let offlineMessageCount = 0;
  let offlineUserCount = 0;
  
  if (offlineMessages.size > 0) {
    offlineUserCount = offlineMessages.size;
    offlineMessages.forEach(queue => {
      offlineMessageCount += queue.length;
    });
  }
  
  return {
    pending: pendingMessages.size,
    history: messageHistory.size,
    offlineTotal: offlineMessageCount,
    offlineUsers: offlineUserCount,
    timestamp: new Date()
  };
}

/**
 * Update default settings
 * 
 * @param {Object} settings - New settings
 * @returns {Object} Updated settings
 */
function updateSettings(settings = {}) {
  Object.assign(DEFAULT_SETTINGS, settings);
  return { ...DEFAULT_SETTINGS };
}

/**
 * Get current settings
 * 
 * @returns {Object} Current settings
 */
function getSettings() {
  return { ...DEFAULT_SETTINGS };
}

module.exports = {
  createMessage,
  serializeMessage,
  deserializeMessage,
  trackMessage,
  acknowledgeMessage,
  queueOfflineMessage,
  getOfflineMessages,
  clearOfflineMessages,
  getMessageStats,
  updateSettings,
  getSettings
}; 