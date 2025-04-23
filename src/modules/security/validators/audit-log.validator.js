const { body, param, query } = require('express-validator');

/**
 * Validation for listing audit logs
 */
exports.listAuditLogs = [
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
  
  query('entity_type')
    .optional()
    .isString()
    .withMessage('Entity type must be a string'),
  
  query('entity_id')
    .optional()
    .isInt()
    .withMessage('Entity ID must be an integer'),
  
  query('user_id')
    .optional()
    .isInt()
    .withMessage('User ID must be an integer'),
  
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((value, { req }) => {
      if (req.query.start_date && value) {
        const startDate = new Date(req.query.start_date);
        const endDate = new Date(value);
        if (endDate < startDate) {
          throw new Error('End date must be after start date');
        }
      }
      return true;
    })
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