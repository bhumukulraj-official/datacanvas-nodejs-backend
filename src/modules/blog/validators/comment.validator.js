const { body, param, query, validationResult } = require('express-validator');
const { BadRequestError } = require('../../../shared/errors');

// Helper function to validate and handle errors
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    return next(new BadRequestError('Validation Error', errorMessages));
  }
  next();
};

// Validate creating a new comment
exports.createComment = [
  param('postId')
    .isInt().withMessage('Invalid post ID'),
  
  body('author_name')
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2-100 characters'),
  
  body('author_email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address'),
  
  body('author_website')
    .optional()
    .isURL().withMessage('Must be a valid URL'),
  
  body('content')
    .notEmpty().withMessage('Comment content is required')
    .isLength({ min: 2, max: 3000 }).withMessage('Comment must be between 2-3000 characters'),
  
  body('parent_id')
    .optional()
    .isInt().withMessage('Parent comment ID must be an integer'),
  
  validateRequest
];

// Validate getting comments for a post
exports.getComments = [
  param('postId')
    .isInt().withMessage('Invalid post ID'),
  
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1-100'),
  
  validateRequest
];

// Validate updating a comment status (admin)
exports.updateCommentStatus = [
  param('id')
    .isInt().withMessage('Invalid comment ID'),
  
  body('status')
    .isIn(['pending', 'approved', 'spam', 'rejected']).withMessage('Invalid status value'),
  
  validateRequest
];

// Validate deleting a comment (admin)
exports.deleteComment = [
  param('id')
    .isInt().withMessage('Invalid comment ID'),
  
  validateRequest
]; 