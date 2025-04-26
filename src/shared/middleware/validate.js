/**
 * Validate middleware re-export
 * This file exports the validation middleware functions from validate.middleware.js
 * and enhances it to work with both express-validator and Joi validation approaches
 */
const validateMiddleware = require('./validate.middleware');
const logger = require('../utils/logger');

/**
 * Enhanced validate middleware that works with both express-validator and Joi schemas
 * @param {Object|Array} schema - Can be either express-validator chains or Joi schemas
 * @returns {Function} Express middleware
 */
const validate = (schema) => {
  // If it's already a middleware function, return it
  if (typeof schema === 'function') {
    return schema;
  }
  
  // If it's an array (express-validator format), use the original middleware
  if (Array.isArray(schema)) {
    return validateMiddleware.validate(schema);
  }
  
  // If it has a 'validate' method (Joi schema format), create an adapter
  if (schema && typeof schema === 'object') {
    // Handle Joi-like schema objects with body/query/params
    if (schema.body || schema.query || schema.params) {
      return (req, res, next) => {
        try {
          // Validate request parts based on schema
          ['body', 'query', 'params'].forEach(key => {
            if (schema[key]) {
              // Try to use Joi validate if available
              if (schema[key].validate) {
                const { error, value } = schema[key].validate(req[key]);
                if (error) {
                  return res.status(400).json({
                    status: 'error',
                    message: error.details[0].message,
                    code: 'VALIDATION_ERROR'
                  });
                }
                // Optional: replace with validated value
                req[key] = value;
              }
            }
          });
          next();
        } catch (err) {
          logger.error('Validation error:', err);
          return res.status(400).json({
            status: 'error',
            message: 'Validation error',
            code: 'VALIDATION_ERROR'
          });
        }
      };
    }
  }
  
  // Default: pass through to next middleware
  logger.warn('Unrecognized validation schema format');
  return (req, res, next) => next();
};

module.exports = validate; 