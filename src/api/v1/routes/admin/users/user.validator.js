/**
 * Admin User Management Validators
 */
const { body, query, param, validationResult } = require('express-validator');
const { AppError } = require('../../../../../shared/errors');

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
 * Validate user ID parameter
 */
exports.validateUserId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),
  
  handleValidationErrors
];

/**
 * Validate list users request
 */
exports.validateListUsers = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('role')
    .optional()
    .isIn(['admin', 'editor', 'user'])
    .withMessage('Role must be one of: admin, editor, user'),
  
  query('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended', 'banned'])
    .withMessage('Status must be one of: active, inactive, suspended, banned'),
  
  query('search')
    .optional()
    .isString()
    .withMessage('Search must be a string'),
  
  handleValidationErrors
];

/**
 * Validate create user request
 */
exports.validateCreateUser = [
  body('username')
    .isString()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_-]{3,50}$/)
    .withMessage('Username can only contain letters, numbers, underscores and hyphens'),
  
  body('email')
    .isEmail()
    .withMessage('Email must be valid')
    .normalizeEmail(),
  
  body('password')
    .isString()
    .isLength({ min: 8, max: 100 })
    .withMessage('Password must be between 8 and 100 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'),
  
  body('first_name')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('First name must be less than 50 characters'),
  
  body('last_name')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Last name must be less than 50 characters'),
  
  body('role')
    .isIn(['admin', 'editor', 'user'])
    .withMessage('Role must be one of: admin, editor, user'),
  
  body('status')
    .isIn(['active', 'inactive', 'suspended', 'banned'])
    .withMessage('Status must be one of: active, inactive, suspended, banned'),
  
  handleValidationErrors
];

/**
 * Validate update user request
 */
exports.validateUpdateUser = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),
  
  body('username')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_-]{3,50}$/)
    .withMessage('Username can only contain letters, numbers, underscores and hyphens'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email must be valid')
    .normalizeEmail(),
  
  body('first_name')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('First name must be less than 50 characters'),
  
  body('last_name')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Last name must be less than 50 characters'),
  
  body('bio')
    .optional()
    .isString()
    .withMessage('Bio must be a string'),
  
  body('avatar')
    .optional()
    .isURL()
    .withMessage('Avatar must be a valid URL'),
  
  handleValidationErrors
];

/**
 * Validate change role request
 */
exports.validateChangeRole = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),
  
  body('role')
    .isIn(['admin', 'editor', 'user'])
    .withMessage('Role must be one of: admin, editor, user'),
  
  handleValidationErrors
];

/**
 * Validate change status request
 */
exports.validateChangeStatus = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),
  
  body('status')
    .isIn(['active', 'inactive', 'suspended', 'banned'])
    .withMessage('Status must be one of: active, inactive, suspended, banned'),
  
  body('reason')
    .optional()
    .isString()
    .isLength({ max: 255 })
    .withMessage('Reason must be less than 255 characters'),
  
  handleValidationErrors
]; 