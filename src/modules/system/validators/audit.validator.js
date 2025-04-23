/**
 * Audit validator
 * Validates audit logging requests
 */
const { body, param, query } = require('express-validator');

/**
 * Validate get audit logs request
 */
exports.getAuditLogs = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('userId')
    .optional()
    .isString()
    .withMessage('User ID must be a string'),
  query('action')
    .optional()
    .isString()
    .withMessage('Action must be a string'),
  query('entityType')
    .optional()
    .isString()
    .withMessage('Entity type must be a string'),
  query('entityId')
    .optional()
    .isString()
    .withMessage('Entity ID must be a string'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  query('sortBy')
    .optional()
    .isIn(['id', 'user_id', 'action', 'entity_type', 'created_at'])
    .withMessage('Sort by must be one of: id, user_id, action, entity_type, created_at'),
  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('Sort order must be ASC or DESC')
];

/**
 * Validate get audit log by ID request
 */
exports.getAuditLogById = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Audit log ID must be a positive integer')
];

/**
 * Validate create audit log request
 */
exports.createAuditLog = [
  body('action')
    .notEmpty()
    .withMessage('Action is required')
    .isString()
    .withMessage('Action must be a string')
    .isLength({ max: 100 })
    .withMessage('Action cannot exceed 100 characters'),
  body('entityType')
    .optional()
    .isString()
    .withMessage('Entity type must be a string')
    .isLength({ max: 50 })
    .withMessage('Entity type cannot exceed 50 characters'),
  body('entityId')
    .optional()
    .isString()
    .withMessage('Entity ID must be a string')
    .isLength({ max: 36 })
    .withMessage('Entity ID cannot exceed 36 characters'),
  body('details')
    .optional()
    .isObject()
    .withMessage('Details must be an object')
]; 