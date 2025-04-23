const { body, param, query, validationResult } = require('express-validator');
const { AppError } = require('../../../shared/errors');
const { validationHandler } = require('../../../middleware/validationHandler');

/**
 * Audit Log Validators
 */

// Common validation handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const validationErrors = errors.array().map(error => ({
      field: error.param,
      message: error.msg
    }));
    return next(new AppError('Validation error', 400, 'VAL_001', validationErrors));
  }
  next();
};

/**
 * Validate get audit logs request
 */
const validateQueryAuditLogs = [
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
    .isMongoId()
    .withMessage('Invalid user ID format'),
  
  query('action')
    .optional()
    .isString()
    .withMessage('Action must be a string'),
  
  query('resource')
    .optional()
    .isString()
    .withMessage('Resource must be a string'),
  
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
    .isIn(['created_at', 'action', 'entity_type', 'entity_id', 'user_id'])
    .withMessage('Sort by must be one of: created_at, action, entity_type, entity_id, user_id'),
  
  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('Sort order must be either ASC or DESC'),
  
  validationHandler
];

/**
 * Validate audit log ID parameter
 */
const validateAuditLogId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid audit log ID format'),
  
  validationHandler
];

/**
 * Validate entity audit history request
 */
exports.validateEntityAuditHistory = [
  param('type')
    .isString()
    .withMessage('Entity type must be a string'),
  
  param('id')
    .isInt({ min: 1 })
    .withMessage('Entity ID must be a positive integer'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('Sort order must be either ASC or DESC'),
  
  handleValidationErrors
];

/**
 * Validate user activity logs request
 */
exports.validateUserActivityLogs = [
  param('userId')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('action')
    .optional()
    .isString()
    .withMessage('Action must be a string'),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  
  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('Sort order must be either ASC or DESC'),
  
  handleValidationErrors
];

/**
 * Validation for creating an audit log
 */
exports.createAuditLog = [
  body('action')
    .isString()
    .isLength({ min: 2, max: 100 })
    .withMessage('Action must be between 2 and 100 characters'),
  
  body('entity_type')
    .optional()
    .isString()
    .isLength({ max: 50 })
    .withMessage('Entity type must be at most 50 characters'),
  
  body('entity_id')
    .optional()
    .isInt()
    .withMessage('Entity ID must be an integer'),
  
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string'),
  
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object')
];

/**
 * Validation for getting security summary
 */
exports.getSecuritySummary = [
  query('start_date')
    .isISO8601()
    .withMessage('Start date is required and must be a valid date'),
  
  query('end_date')
    .isISO8601()
    .withMessage('End date is required and must be a valid date')
    .custom((value, { req }) => {
      if (req.query.start_date && value) {
        const startDate = new Date(req.query.start_date);
        const endDate = new Date(value);
        if (endDate < startDate) {
          throw new Error('End date must be after start date');
        }
        
        // Check that the date range is not too large (e.g., max 1 year)
        const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
        if (endDate - startDate > oneYearInMs) {
          throw new Error('Date range cannot exceed 1 year');
        }
      }
      return true;
    })
];

module.exports = {
  validateQueryAuditLogs,
  validateAuditLogId
}; 