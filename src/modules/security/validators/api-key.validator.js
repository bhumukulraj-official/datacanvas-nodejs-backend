const { body, param, query } = require('express-validator');

/**
 * Validation for getting an API key by ID
 */
exports.getApiKey = [
  param('id')
    .isInt()
    .withMessage('API key ID must be an integer')
];

/**
 * Validation for creating a new API key
 */
exports.createApiKey = [
  body('name')
    .isString()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('permissions')
    .optional()
    .isArray()
    .withMessage('Permissions must be an array of integers'),
  
  body('permissions.*')
    .optional()
    .isInt()
    .withMessage('Each permission must be an integer'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'revoked'])
    .withMessage('Status must be either active, inactive, or revoked'),
  
  body('expiresIn')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Expiration value must be a positive integer'),
  
  body('expiresUnit')
    .optional()
    .isIn(['day', 'month', 'year'])
    .withMessage('Expiration unit must be day, month, or year')
];

/**
 * Validation for updating an API key
 */
exports.updateApiKey = [
  param('id')
    .isInt()
    .withMessage('API key ID must be an integer'),
  
  body('name')
    .optional()
    .isString()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('permissions')
    .optional()
    .isArray()
    .withMessage('Permissions must be an array of integers'),
  
  body('permissions.*')
    .optional()
    .isInt()
    .withMessage('Each permission must be an integer'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'revoked'])
    .withMessage('Status must be either active, inactive, or revoked'),
  
  body('expiresIn')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Expiration value must be a positive integer'),
  
  body('expiresUnit')
    .optional()
    .isIn(['day', 'month', 'year'])
    .withMessage('Expiration unit must be day, month, or year')
];

/**
 * Validation for revoking an API key
 */
exports.revokeApiKey = [
  param('id')
    .isInt()
    .withMessage('API key ID must be an integer')
];

/**
 * Validation for deleting an API key
 */
exports.deleteApiKey = [
  param('id')
    .isInt()
    .withMessage('API key ID must be an integer')
];

/**
 * Validation for API key usage statistics
 */
exports.getApiKeyUsageStats = [
  query('timeframe')
    .optional()
    .matches(/^\d+[dwm]$/)
    .withMessage('Timeframe must be in format like 30d, 4w, 6m (days, weeks, months)'),
  
  query('groupBy')
    .optional()
    .isIn(['hourly', 'daily', 'weekly', 'monthly'])
    .withMessage('Group by must be hourly, daily, weekly, or monthly')
]; 