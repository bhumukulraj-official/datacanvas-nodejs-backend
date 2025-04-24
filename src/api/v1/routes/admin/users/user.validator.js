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
  
  query('sort_by')
    .optional()
    .isIn(['username', 'email', 'created_at', 'updated_at', 'last_login', 'role', 'status'])
    .withMessage('Sort field must be one of: username, email, created_at, updated_at, last_login, role, status'),
    
  query('sort_order')
    .optional()
    .isIn(['asc', 'desc', 'ASC', 'DESC'])
    .withMessage('Sort order must be one of: asc, desc'),
    
  query('created_after')
    .optional()
    .isISO8601()
    .withMessage('Created after date must be a valid ISO 8601 date'),
    
  query('created_before')
    .optional()
    .isISO8601()
    .withMessage('Created before date must be a valid ISO 8601 date'),
    
  query('last_login_after')
    .optional()
    .isISO8601()
    .withMessage('Last login after date must be a valid ISO 8601 date'),
    
  query('last_login_before')
    .optional()
    .isISO8601()
    .withMessage('Last login before date must be a valid ISO 8601 date'),
    
  query('email_verified')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Email verified must be true or false'),
  
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

/**
 * Validate export users request
 */
exports.validateExportUsers = [
  query('role')
    .optional()
    .isIn(['admin', 'editor', 'user'])
    .withMessage('Role must be one of: admin, editor, user'),
  
  query('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended', 'banned'])
    .withMessage('Status must be one of: active, inactive, suspended, banned'),
    
  query('created_after')
    .optional()
    .isISO8601()
    .withMessage('Created after date must be a valid ISO 8601 date'),
    
  query('created_before')
    .optional()
    .isISO8601()
    .withMessage('Created before date must be a valid ISO 8601 date'),
    
  query('email_verified')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Email verified must be true or false'),
  
  handleValidationErrors
];

/**
 * Validate bulk change user status request
 */
exports.validateBulkChangeStatus = [
  body('userIds')
    .isArray({ min: 1 })
    .withMessage('User IDs must be a non-empty array'),
  
  body('userIds.*')
    .isInt({ min: 1 })
    .withMessage('Each user ID must be a positive integer'),
  
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

/**
 * Validate bulk change user role request
 */
exports.validateBulkChangeRole = [
  body('userIds')
    .isArray({ min: 1 })
    .withMessage('User IDs must be a non-empty array'),
  
  body('userIds.*')
    .isInt({ min: 1 })
    .withMessage('Each user ID must be a positive integer'),
  
  body('role')
    .isIn(['admin', 'editor', 'user'])
    .withMessage('Role must be one of: admin, editor, user'),
  
  handleValidationErrors
];

/**
 * Validate bulk delete users request
 */
exports.validateBulkDeleteUsers = [
  body('userIds')
    .isArray({ min: 1 })
    .withMessage('User IDs must be a non-empty array'),
  
  body('userIds.*')
    .isInt({ min: 1 })
    .withMessage('Each user ID must be a positive integer'),
  
  handleValidationErrors
];

/**
 * Validate get user sessions request
 */
exports.validateGetUserSessions = [
  param('id')
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
  
  handleValidationErrors
];

/**
 * Validate revoke user session request
 */
exports.validateRevokeUserSession = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),
  
  param('sessionId')
    .isInt({ min: 1 })
    .withMessage('Session ID must be a positive integer'),
  
  handleValidationErrors
];

/**
 * Validate revoke all user sessions request
 */
exports.validateRevokeAllUserSessions = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),
  
  handleValidationErrors
]; 