/**
 * WebSocket Protocol Service
 * 
 * Handles WebSocket protocol-specific operations including:
 * - Protocol message format definitions
 * - Protocol version handling
 * - Protocol feature detection
 * - Protocol error handling
 */
const logger = require('../../../shared/utils/logger');

// Protocol version constants
const PROTOCOL_VERSIONS = {
  V1: '1.0',
  V2: '2.0',
};

// Protocol features
const PROTOCOL_FEATURES = {
  [PROTOCOL_VERSIONS.V1]: {
    messageAcknowledgment: false,
    messageCompression: false,
    offlineMessages: false,
    presenceTracking: false,
    messageEncryption: false
  },
  [PROTOCOL_VERSIONS.V2]: {
    messageAcknowledgment: true,
    messageCompression: true,
    offlineMessages: true,
    presenceTracking: true,
    messageEncryption: false
  }
};

// Protocol message types
const MESSAGE_TYPES = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  MESSAGE: 'message',
  ACK: 'ack',
  PRESENCE: 'presence',
  ERROR: 'error',
  PING: 'ping',
  PONG: 'pong',
  SYSTEM: 'system'
};

// Protocol error codes
const ERROR_CODES = {
  INVALID_MESSAGE: 4000,
  AUTHENTICATION_FAILED: 4001,
  MESSAGE_TOO_LARGE: 4002,
  RATE_LIMITED: 4003,
  PROTOCOL_ERROR: 4004,
  CONNECTION_TIMEOUT: 4008,
  INTERNAL_ERROR: 4500,
  SERVICE_UNAVAILABLE: 4503
};

// Default protocol options
const DEFAULT_OPTIONS = {
  defaultVersion: PROTOCOL_VERSIONS.V2,
  enforceVersionCheck: true,
  maxMessageSize: 1024 * 1024, // 1MB
  pingInterval: 30000, // 30 seconds
  connectionTimeout: 120000 // 2 minutes
};

/**
 * Check if a protocol feature is supported by a version
 * 
 * @param {string} feature - Feature name
 * @param {string} version - Protocol version
 * @returns {boolean} Whether the feature is supported
 */
function isFeatureSupported(feature, version) {
  // If version not specified, use default
  const protocolVersion = version || DEFAULT_OPTIONS.defaultVersion;
  
  // If no features defined for this version, feature is not supported
  if (!PROTOCOL_FEATURES[protocolVersion]) {
    return false;
  }
  
  // Check if feature exists in features for this version
  return !!PROTOCOL_FEATURES[protocolVersion][feature];
}

/**
 * Create a protocol message object
 * 
 * @param {string} type - Message type
 * @param {any} payload - Message payload
 * @param {Object} options - Message options
 * @returns {Object} Protocol message object
 */
function createProtocolMessage(type, payload, options = {}) {
  if (!Object.values(MESSAGE_TYPES).includes(type)) {
    throw new Error(`Invalid message type: ${type}`);
  }
  
  return {
    type,
    payload,
    id: options.id || generateMessageId(),
    timestamp: options.timestamp || Date.now(),
    version: options.version || DEFAULT_OPTIONS.defaultVersion,
    sender: options.sender || null,
    metadata: options.metadata || {}
  };
}

/**
 * Create an acknowledgment message
 * 
 * @param {string} messageId - ID of the message being acknowledged
 * @param {Object} options - Additional options
 * @returns {Object} ACK message
 */
function createAckMessage(messageId, options = {}) {
  return createProtocolMessage(MESSAGE_TYPES.ACK, {
    messageId,
    status: options.status || 'delivered',
    timestamp: Date.now()
  }, options);
}

/**
 * Create an error message
 * 
 * @param {number} code - Error code
 * @param {string} message - Error message
 * @param {Object} options - Additional options
 * @returns {Object} Error message
 */
function createErrorMessage(code, message, options = {}) {
  // Validate error code
  if (!Object.values(ERROR_CODES).includes(code)) {
    code = ERROR_CODES.PROTOCOL_ERROR;
  }
  
  return createProtocolMessage(MESSAGE_TYPES.ERROR, {
    code,
    message,
    details: options.details || null
  }, options);
}

/**
 * Create a system message
 * 
 * @param {string} event - System event name
 * @param {any} data - Event data
 * @param {Object} options - Additional options
 * @returns {Object} System message
 */
function createSystemMessage(event, data, options = {}) {
  return createProtocolMessage(MESSAGE_TYPES.SYSTEM, {
    event,
    data
  }, options);
}

/**
 * Generate a unique message ID
 * 
 * @returns {string} Unique message ID
 */
function generateMessageId() {
  // Simple implementation using timestamp and random number
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `${timestamp}-${random}`;
}

/**
 * Validate a protocol message
 * 
 * @param {Object} message - Message to validate
 * @returns {Object} Validation result {valid: boolean, error: string}
 */
function validateMessage(message) {
  // Check if message is an object
  if (!message || typeof message !== 'object') {
    return {
      valid: false,
      error: 'Message must be an object'
    };
  }
  
  // Check required fields
  if (!message.type) {
    return {
      valid: false,
      error: 'Message must have a type'
    };
  }
  
  // Check if type is valid
  if (!Object.values(MESSAGE_TYPES).includes(message.type)) {
    return {
      valid: false,
      error: `Invalid message type: ${message.type}`
    };
  }
  
  // Check message size if payload is present
  if (message.payload) {
    try {
      const size = JSON.stringify(message).length;
      if (size > DEFAULT_OPTIONS.maxMessageSize) {
        return {
          valid: false,
          error: `Message exceeds maximum size of ${DEFAULT_OPTIONS.maxMessageSize} bytes`
        };
      }
    } catch (error) {
      return {
        valid: false,
        error: 'Unable to calculate message size'
      };
    }
  }
  
  // If enforcing version check, validate version is supported
  if (DEFAULT_OPTIONS.enforceVersionCheck && message.version) {
    if (!Object.values(PROTOCOL_VERSIONS).includes(message.version)) {
      return {
        valid: false,
        error: `Unsupported protocol version: ${message.version}`
      };
    }
  }
  
  return {
    valid: true
  };
}

/**
 * Parse a raw message string
 * 
 * @param {string} messageString - Raw message string
 * @returns {Object} Parsed message or error object
 */
function parseMessage(messageString) {
  try {
    // Try to parse the message
    const parsedMessage = JSON.parse(messageString);
    
    // Validate the parsed message
    const validation = validateMessage(parsedMessage);
    if (!validation.valid) {
      logger.debug(`Invalid message format: ${validation.error}`, {
        message: messageString.substring(0, 100)
      });
      
      return {
        error: true,
        code: ERROR_CODES.INVALID_MESSAGE,
        message: validation.error
      };
    }
    
    return parsedMessage;
  } catch (error) {
    logger.debug(`Failed to parse message: ${error.message}`, {
      message: messageString.substring(0, 100)
    });
    
    return {
      error: true,
      code: ERROR_CODES.INVALID_MESSAGE,
      message: 'Invalid message format'
    };
  }
}

/**
 * Update protocol options
 * 
 * @param {Object} options - New options
 * @returns {Object} Updated options
 */
function updateOptions(options = {}) {
  Object.assign(DEFAULT_OPTIONS, options);
  return { ...DEFAULT_OPTIONS };
}

/**
 * Get current protocol options
 * 
 * @returns {Object} Current options
 */
function getOptions() {
  return { ...DEFAULT_OPTIONS };
}

module.exports = {
  PROTOCOL_VERSIONS,
  PROTOCOL_FEATURES,
  MESSAGE_TYPES,
  ERROR_CODES,
  isFeatureSupported,
  createProtocolMessage,
  createAckMessage,
  createErrorMessage,
  createSystemMessage,
  generateMessageId,
  validateMessage,
  parseMessage,
  updateOptions,
  getOptions
}; 