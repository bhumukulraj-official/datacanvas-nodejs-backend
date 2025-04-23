/**
 * API Key Validator
 * Contains validation rules for API key operations
 */
const { body, param, query } = require('express-validator');

exports.createApiKey = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('permissions')
    .optional()
    .isObject()
    .withMessage('Permissions must be an object'),
  
  body('rate_limit')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Rate limit must be between 1 and 10000'),
  
  body('rate_limit_period')
    .optional()
    .isIn(['second', 'minute', 'hour', 'day'])
    .withMessage('Rate limit period must be second, minute, hour, or day'),
  
  body('expires_at')
    .optional()
    .isISO8601()
    .withMessage('Expires at must be a valid date')
    .custom((value) => {
      if (value && new Date(value) <= new Date()) {
        throw new Error('Expiration date must be in the future');
      }
      return true;
    })
];

exports.updateApiKey = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('API key ID must be a positive integer'),
  
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('permissions')
    .optional()
    .isObject()
    .withMessage('Permissions must be an object'),
  
  body('rate_limit')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Rate limit must be between 1 and 10000'),
  
  body('rate_limit_period')
    .optional()
    .isIn(['second', 'minute', 'hour', 'day'])
    .withMessage('Rate limit period must be second, minute, hour, or day'),
  
  body('expires_at')
    .optional()
    .isISO8601()
    .withMessage('Expires at must be a valid date')
    .custom((value) => {
      if (value && new Date(value) <= new Date()) {
        throw new Error('Expiration date must be in the future');
      }
      return true;
    }),
  
  body('status')
    .optional()
    .isIn(['active', 'revoked', 'expired'])
    .withMessage('Status must be active, revoked, or expired')
];

exports.getApiKeyById = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('API key ID must be a positive integer')
];

exports.deleteApiKey = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('API key ID must be a positive integer')
];

exports.revokeApiKey = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('API key ID must be a positive integer')
];

exports.getApiKeys = [
  query('status')
    .optional()
    .isIn(['active', 'revoked', 'expired', 'all'])
    .withMessage('Status must be active, revoked, expired, or all'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer')
]; 