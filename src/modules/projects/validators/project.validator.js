const { body, query, param, validationResult } = require('express-validator');
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
 * Validate project list parameters
 */
exports.listProjects = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
    .toInt(),
  query('sort')
    .optional()
    .isIn(['createdAt', 'title', 'updatedAt'])
    .withMessage('Sort must be one of: createdAt, title, updatedAt'),
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be asc or desc'),
  query('tags')
    .optional()
    .customSanitizer(value => {
      if (!value) return [];
      return value.split(',').map(tag => tag.trim());
    }),
  validateRequest
];

/**
 * Validate project creation parameters
 */
exports.createProject = [
  body('title')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 200 })
    .withMessage('Title must be at most 200 characters'),
  body('description')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Description is required'),
  body('thumbnail')
    .optional()
    .isURL()
    .withMessage('Thumbnail must be a valid URL'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('technologies')
    .optional()
    .isArray()
    .withMessage('Technologies must be an array'),
  body('githubUrl')
    .optional()
    .isURL()
    .withMessage('Github URL must be a valid URL'),
  body('liveUrl')
    .optional()
    .isURL()
    .withMessage('Live URL must be a valid URL'),
  validateRequest
];

/**
 * Validate project ID parameter
 */
exports.getProject = [
  param('id')
    .isUUID()
    .withMessage('Invalid project ID format'),
  validateRequest
];

/**
 * Validate project update parameters
 */
exports.updateProject = [
  param('id')
    .isUUID()
    .withMessage('Invalid project ID format'),
  body('title')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ max: 200 })
    .withMessage('Title must be at most 200 characters'),
  body('description')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Description cannot be empty'),
  body('thumbnail')
    .optional()
    .isURL()
    .withMessage('Thumbnail must be a valid URL'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('technologies')
    .optional()
    .isArray()
    .withMessage('Technologies must be an array'),
  body('githubUrl')
    .optional()
    .isURL()
    .withMessage('Github URL must be a valid URL'),
  body('liveUrl')
    .optional()
    .isURL()
    .withMessage('Live URL must be a valid URL'),
  validateRequest
];

/**
 * Validate project deletion parameters
 */
exports.deleteProject = [
  param('id')
    .isUUID()
    .withMessage('Invalid project ID format'),
  validateRequest
]; 