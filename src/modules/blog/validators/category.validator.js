const { body, param, validationResult } = require('express-validator');
const { ValidationError } = require('../../../shared/errors');

/**
 * Validate request and handle validation errors
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation error', errors.array());
  }
  next();
};

/**
 * Validate category by slug parameter
 */
exports.getCategory = [
  param('slug')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Slug is required'),
  validateRequest
];

/**
 * Validate category creation parameters
 */
exports.createCategory = [
  body('name')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name must be at most 100 characters'),
  body('slug')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Slug must be at most 100 characters'),
  body('description')
    .optional()
    .isString()
    .trim(),
  validateRequest
];

/**
 * Validate category update parameters
 */
exports.updateCategory = [
  param('id')
    .isUUID()
    .withMessage('Invalid category ID format'),
  body('name')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Name must be at most 100 characters'),
  body('slug')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Slug must be at most 100 characters'),
  body('description')
    .optional()
    .isString()
    .trim(),
  validateRequest
];

/**
 * Validate category deletion parameter
 */
exports.deleteCategory = [
  param('id')
    .isUUID()
    .withMessage('Invalid category ID format'),
  validateRequest
]; 