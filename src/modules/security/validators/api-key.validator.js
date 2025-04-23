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
    .withMessage('Permissions must be an array'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'revoked'])
    .withMessage('Status must be either active, inactive, or revoked'),
  
  body('expires_at')
    .optional()
    .isISO8601()
    .withMessage('Expires at must be a valid date')
    .custom((value) => {
      const now = new Date();
      const expiresAt = new Date(value);
      if (expiresAt <= now) {
        throw new Error('Expiry date must be in the future');
      }
      return true;
    })
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
    .withMessage('Permissions must be an array'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'revoked'])
    .withMessage('Status must be either active, inactive, or revoked'),
  
  body('expires_at')
    .optional()
    .isISO8601()
    .withMessage('Expires at must be a valid date')
    .custom((value) => {
      const now = new Date();
      const expiresAt = new Date(value);
      if (expiresAt <= now) {
        throw new Error('Expiry date must be in the future');
      }
      return true;
    })
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