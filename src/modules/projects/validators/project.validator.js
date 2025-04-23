const { body, query, param, validationResult } = require('express-validator');
const { ValidationError } = require('../../../shared/errors');
const slugify = require('slugify');

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
    .isIn(['created_at', 'title', 'updated_at', 'display_order'])
    .withMessage('Sort must be one of: created_at, title, updated_at, display_order'),
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be asc or desc'),
  query('status')
    .optional()
    .isIn(['draft', 'in_progress', 'completed', 'archived'])
    .withMessage('Status must be one of: draft, in_progress, completed, archived'),
  query('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be true or false')
    .toBoolean(),
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
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('slug')
    .optional()
    .isString()
    .trim()
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug can only contain lowercase letters, numbers, and hyphens')
    .isLength({ max: 200 })
    .withMessage('Slug must be at most 200 characters'),
  body().custom((body, { req }) => {
    // Generate slug from title if not provided
    if (!body.slug && body.title) {
      req.body.slug = slugify(body.title, {
        lower: true,
        strict: true,
        trim: true
      });
    }
    return true;
  }),
  body('description')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters'),
  body('thumbnail_url')
    .optional()
    .isURL()
    .withMessage('Thumbnail URL must be a valid URL'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('technologies')
    .optional()
    .isArray()
    .withMessage('Technologies must be an array'),
  body('github_url')
    .optional()
    .isURL()
    .withMessage('Github URL must be a valid URL'),
  body('live_url')
    .optional()
    .isURL()
    .withMessage('Live URL must be a valid URL'),
  body('start_date')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('end_date')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((value, { req }) => {
      if (value && req.body.start_date && new Date(value) < new Date(req.body.start_date)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('is_featured')
    .optional()
    .isBoolean()
    .withMessage('Featured status must be true or false'),
  body('display_order')
    .optional()
    .isInt()
    .withMessage('Display order must be an integer'),
  body('status')
    .optional()
    .isIn(['draft', 'in_progress', 'completed', 'archived'])
    .withMessage('Status must be one of: draft, in_progress, completed, archived'),
  body('meta_title')
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage('Meta title must be at most 100 characters'),
  body('meta_description')
    .optional()
    .isString()
    .isLength({ max: 200 })
    .withMessage('Meta description must be at most 200 characters'),
  validateRequest
];

/**
 * Validate project ID parameter
 */
exports.getProject = [
  param('id')
    .isInt()
    .withMessage('Invalid project ID format')
    .toInt(),
  validateRequest
];

/**
 * Validate project update parameters
 */
exports.updateProject = [
  param('id')
    .isInt()
    .withMessage('Invalid project ID format')
    .toInt(),
  body('title')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('slug')
    .optional()
    .isString()
    .trim()
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug can only contain lowercase letters, numbers, and hyphens')
    .isLength({ max: 200 })
    .withMessage('Slug must be at most 200 characters'),
  body('description')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Description cannot be empty')
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters'),
  body('thumbnail_url')
    .optional()
    .isURL()
    .withMessage('Thumbnail URL must be a valid URL'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('technologies')
    .optional()
    .isArray()
    .withMessage('Technologies must be an array'),
  body('github_url')
    .optional()
    .isURL()
    .withMessage('Github URL must be a valid URL'),
  body('live_url')
    .optional()
    .isURL()
    .withMessage('Live URL must be a valid URL'),
  body('start_date')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('end_date')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((value, { req }) => {
      if (value && req.body.start_date && new Date(value) < new Date(req.body.start_date)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('is_featured')
    .optional()
    .isBoolean()
    .withMessage('Featured status must be true or false'),
  body('display_order')
    .optional()
    .isInt()
    .withMessage('Display order must be an integer'),
  body('status')
    .optional()
    .isIn(['draft', 'in_progress', 'completed', 'archived'])
    .withMessage('Status must be one of: draft, in_progress, completed, archived'),
  body('meta_title')
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage('Meta title must be at most 100 characters'),
  body('meta_description')
    .optional()
    .isString()
    .isLength({ max: 200 })
    .withMessage('Meta description must be at most 200 characters'),
  validateRequest
];

/**
 * Validate project status update
 */
exports.updateProjectStatus = [
  param('id')
    .isInt()
    .withMessage('Invalid project ID format')
    .toInt(),
  body('status')
    .isIn(['draft', 'in_progress', 'completed', 'archived'])
    .withMessage('Status must be one of: draft, in_progress, completed, archived'),
  validateRequest
];

/**
 * Validate project deletion parameters
 */
exports.deleteProject = [
  param('id')
    .isInt()
    .withMessage('Invalid project ID format')
    .toInt(),
  validateRequest
]; 