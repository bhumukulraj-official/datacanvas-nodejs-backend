/**
 * Validation utilities using express-validator
 * Provides reusable validation chains and custom validation rules
 */
const { body, query, param, validationResult } = require('express-validator');
const { ValidationError } = require('../errors');

/**
 * Validate request and throw error if validation fails
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation error', errors.array());
  }
  next();
};

/**
 * Common validation chains
 */
const validationChains = {
  /**
   * Common ID validation
   */
  id: param('id')
    .isUUID().withMessage('ID must be a valid UUID'),
  
  /**
   * Common pagination validation
   */
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer')
      .toInt(),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
      .toInt()
  ],
  
  /**
   * Email validation
   */
  email: body('email')
    .isEmail()
    .withMessage('Email must be valid')
    .normalizeEmail(),
  
  /**
   * Password validation
   */
  password: body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*]/).withMessage('Password must contain at least one special character'),
  
  /**
   * Name validation
   */
  name: body('name')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  /**
   * URL validation
   */
  url: (field) => body(field)
    .optional()
    .isURL()
    .withMessage('URL must be valid'),
  
  /**
   * String field validation with customizable length
   */
  string: (field, { min = 1, max = 255, required = true } = {}) => {
    const chain = body(field);
    
    if (!required) {
      chain.optional();
    }
    
    return chain
      .isString()
      .withMessage(`${field} must be a string`)
      .isLength({ min, max })
      .withMessage(`${field} must be between ${min} and ${max} characters`);
  },
  
  /**
   * Array validation
   */
  array: (field, { required = true } = {}) => {
    const chain = body(field);
    
    if (!required) {
      chain.optional();
    }
    
    return chain
      .isArray()
      .withMessage(`${field} must be an array`);
  }
};

/**
 * Custom validators
 */
const customValidators = {
  /**
   * Checks if field matches another field
   * @param {string} field - Field to compare
   * @param {string} matchField - Field to match against
   * @param {string} message - Error message
   * @returns {Function} Validator function
   */
  matches: (field, matchField, message) => {
    return body(field).custom((value, { req }) => {
      if (value !== req.body[matchField]) {
        throw new Error(message || `${field} does not match ${matchField}`);
      }
      return true;
    });
  },
  
  /**
   * Check if value exists in database
   * @param {Object} model - Sequelize model
   * @param {string} field - Field name in model
   * @param {string} paramField - Field name in request params/body
   * @param {string} message - Error message
   * @returns {Function} Validator function
   */
  exists: (model, field, paramField, message) => {
    return body(paramField).custom(async (value) => {
      const query = {};
      query[field] = value;
      
      const record = await model.findOne({ where: query });
      
      if (!record) {
        throw new Error(message || `${field} does not exist`);
      }
      
      return true;
    });
  },
  
  /**
   * Check if value is unique in database
   * @param {Object} model - Sequelize model
   * @param {string} field - Field name in model
   * @param {string} paramField - Field name in request params/body
   * @param {string} message - Error message
   * @param {string} exceptParam - Field to exclude (for updates)
   * @returns {Function} Validator function
   */
  unique: (model, field, paramField, message, exceptParam) => {
    return body(paramField).custom(async (value, { req }) => {
      const query = {};
      query[field] = value;
      
      // If exceptParam is provided, exclude that record
      if (exceptParam && req.params[exceptParam]) {
        const exceptField = 'id';
        query[exceptField] = { $ne: req.params[exceptParam] };
      }
      
      const record = await model.findOne({ where: query });
      
      if (record) {
        throw new Error(message || `${field} already exists`);
      }
      
      return true;
    });
  }
};

module.exports = {
  validateRequest,
  validationChains,
  customValidators
}; 