const { body, param, query } = require('express-validator');

/**
 * Validation for getting all connections
 */
exports.getAllConnections = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('status')
    .optional()
    .isIn(['connected', 'disconnected', 'idle'])
    .withMessage('Status must be one of: connected, disconnected, idle')
];

/**
 * Validation for getting user connections
 */
exports.getUserConnections = [
  param('userId')
    .isInt()
    .withMessage('User ID must be an integer'),
  
  query('status')
    .optional()
    .isIn(['connected', 'disconnected', 'idle'])
    .withMessage('Status must be one of: connected, disconnected, idle')
];

/**
 * Validation for getting connection by ID
 */
exports.getConnectionById = [
  param('connectionId')
    .isString()
    .isLength({ min: 10, max: 100 })
    .withMessage('Connection ID is required and must be between 10-100 characters')
];

/**
 * Validation for disconnecting a connection
 */
exports.disconnectConnection = [
  param('connectionId')
    .isString()
    .isLength({ min: 10, max: 100 })
    .withMessage('Connection ID is required and must be between 10-100 characters'),
  
  body('reason')
    .optional()
    .isString()
    .isLength({ max: 255 })
    .withMessage('Reason must be a string with maximum length of 255 characters')
];

/**
 * Validation for sending message to user
 */
exports.sendMessageToUser = [
  param('userId')
    .isInt()
    .withMessage('User ID must be an integer'),
  
  body('type')
    .isString()
    .isIn(['text', 'notification', 'command', 'error'])
    .withMessage('Type must be one of: text, notification, command, error'),
  
  body('payload')
    .isObject()
    .withMessage('Payload must be an object'),
  
  body('priority')
    .optional()
    .isBoolean()
    .withMessage('Priority must be a boolean')
];

/**
 * Validation for broadcasting a message
 */
exports.broadcastMessage = [
  body('channel')
    .isString()
    .notEmpty()
    .withMessage('Channel is required'),
  
  body('type')
    .isString()
    .isIn(['text', 'notification', 'command', 'error'])
    .withMessage('Type must be one of: text, notification, command, error'),
  
  body('payload')
    .isObject()
    .withMessage('Payload must be an object'),
  
  body('priority')
    .optional()
    .isBoolean()
    .withMessage('Priority must be a boolean')
]; 