const { body, query, param, validationResult } = require('express-validator');
const { AppError } = require('../../../shared/errors');

/**
 * Validate contact form submission
 */
exports.validateContactSubmission = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 100 }).withMessage('Name must be less than 100 characters'),
    
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .isLength({ max: 255 }).withMessage('Email must be less than 255 characters'),
    
  body('subject')
    .trim()
    .notEmpty().withMessage('Subject is required')
    .isLength({ max: 200 }).withMessage('Subject must be less than 200 characters'),
    
  body('message')
    .trim()
    .notEmpty().withMessage('Message is required')
    .isLength({ max: 1000 }).withMessage('Message must be less than 1000 characters'),
    
  body('recaptchaToken')
    .notEmpty().withMessage('reCAPTCHA verification is required'),
    
  // Handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const validationErrors = errors.array().map(error => ({
        field: error.param,
        message: error.msg
      }));
      
      return next(new AppError('Validation error', 400, 'VAL_001', validationErrors));
    }
    next();
  }
];

/**
 * Validate listing parameters for contact submissions
 */
exports.validateListSubmissions = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    
  query('status')
    .optional()
    .isIn(['new', 'read', 'replied', 'archived']).withMessage('Invalid status'),
    
  query('sortBy')
    .optional()
    .isIn(['created_at', 'name', 'email', 'subject', 'status']).withMessage('Invalid sort field'),
    
  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC']).withMessage('Sort order must be ASC or DESC'),
    
  // Handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const validationErrors = errors.array().map(error => ({
        field: error.param,
        message: error.msg
      }));
      
      return next(new AppError('Validation error', 400, 'VAL_001', validationErrors));
    }
    next();
  }
];

/**
 * Validate contact submission ID parameter
 */
exports.validateSubmissionId = [
  param('id')
    .isInt().withMessage('Invalid submission ID'),
    
  // Handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const validationErrors = errors.array().map(error => ({
        field: error.param,
        message: error.msg
      }));
      
      return next(new AppError('Validation error', 400, 'VAL_001', validationErrors));
    }
    next();
  }
];

/**
 * Validate update for contact submission
 */
exports.validateUpdateSubmission = [
  param('id')
    .isInt().withMessage('Invalid submission ID'),
    
  body('status')
    .optional()
    .isIn(['new', 'read', 'replied', 'archived']).withMessage('Invalid status'),
    
  body('notes')
    .optional()
    .isString().withMessage('Notes must be a string'),
    
  body('assigned_to')
    .optional()
    .isInt().withMessage('Invalid user ID')
    .toInt(),
    
  // Handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const validationErrors = errors.array().map(error => ({
        field: error.param,
        message: error.msg
      }));
      
      return next(new AppError('Validation error', 400, 'VAL_001', validationErrors));
    }
    next();
  }
];

/**
 * Validate reply to contact submission
 */
exports.validateReplySubmission = [
  param('id')
    .isInt().withMessage('Invalid submission ID'),
    
  body('reply_message')
    .notEmpty().withMessage('Reply message is required')
    .isString().withMessage('Reply message must be a string'),
    
  // Handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const validationErrors = errors.array().map(error => ({
        field: error.param,
        message: error.msg
      }));
      
      return next(new AppError('Validation error', 400, 'VAL_001', validationErrors));
    }
    next();
  }
]; 