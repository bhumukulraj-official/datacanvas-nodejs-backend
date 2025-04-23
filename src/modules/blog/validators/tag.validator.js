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

// Validate creating a new tag
exports.createTag = [
  body('name')
    .notEmpty().withMessage('Tag name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Tag name must be between 2-50 characters'),
  
  body('slug')
    .optional()
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).withMessage('Slug must contain only lowercase letters, numbers, and hyphens'),
  
  body('description')
    .optional()
    .isString().withMessage('Description must be a string'),
  
  validateRequest
];

// Validate updating a tag
exports.updateTag = [
  param('id')
    .isInt().withMessage('Invalid tag ID'),
  
  body('name')
    .optional()
    .isLength({ min: 2, max: 50 }).withMessage('Tag name must be between 2-50 characters'),
  
  body('slug')
    .optional()
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).withMessage('Slug must contain only lowercase letters, numbers, and hyphens'),
  
  body('description')
    .optional()
    .isString().withMessage('Description must be a string'),
  
  validateRequest
];

// Validate getting a tag by slug
exports.getTag = [
  param('slug')
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).withMessage('Invalid tag slug format'),
  
  validateRequest
];

// Validate deleting a tag
exports.deleteTag = [
  param('id')
    .isInt().withMessage('Invalid tag ID'),
  
  validateRequest
]; 