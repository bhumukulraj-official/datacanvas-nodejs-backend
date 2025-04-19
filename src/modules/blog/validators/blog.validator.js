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
 * Validate blog posts list parameters
 */
exports.listPosts = [
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
    .isIn(['publishedAt', 'title', 'createdAt', 'updatedAt'])
    .withMessage('Sort must be one of: publishedAt, title, createdAt, updatedAt'),
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be asc or desc'),
  query('category')
    .optional()
    .isString()
    .trim()
    .escape(),
  query('tag')
    .optional()
    .isString()
    .trim()
    .escape(),
  query('search')
    .optional()
    .isString()
    .trim()
    .escape(),
  validateRequest
];

/**
 * Validate get post by slug parameter
 */
exports.getPost = [
  param('slug')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Slug is required')
    .isLength({ max: 200 })
    .withMessage('Slug must be at most 200 characters'),
  validateRequest
];

/**
 * Validate search query
 */
exports.searchPosts = [
  query('q')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Search query is required')
    .isLength({ min: 2 })
    .withMessage('Search query must be at least 2 characters'),
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
  validateRequest
];

/**
 * Validate blog post creation parameters
 */
exports.createPost = [
  body('title')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 200 })
    .withMessage('Title must be at most 200 characters'),
  body('content')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Content is required'),
  body('excerpt')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Excerpt must be at most 500 characters'),
  body('slug')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Slug must be at most 200 characters'),
  body('featuredImage')
    .optional()
    .isURL()
    .withMessage('Featured image must be a valid URL'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('status')
    .optional()
    .isIn(['draft', 'published'])
    .withMessage('Status must be either draft or published'),
  body('categoryId')
    .isUUID()
    .withMessage('Valid category ID is required'),
  validateRequest
];

/**
 * Validate blog post update parameters
 */
exports.updatePost = [
  param('id')
    .isUUID()
    .withMessage('Invalid post ID format'),
  body('title')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ max: 200 })
    .withMessage('Title must be at most 200 characters'),
  body('content')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Content cannot be empty'),
  body('excerpt')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Excerpt must be at most 500 characters'),
  body('slug')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Slug must be at most 200 characters'),
  body('featuredImage')
    .optional()
    .isURL()
    .withMessage('Featured image must be a valid URL'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('status')
    .optional()
    .isIn(['draft', 'published'])
    .withMessage('Status must be either draft or published'),
  body('categoryId')
    .optional()
    .isUUID()
    .withMessage('Valid category ID is required'),
  validateRequest
];

/**
 * Validate blog post deletion parameter
 */
exports.deletePost = [
  param('id')
    .isUUID()
    .withMessage('Invalid post ID format'),
  validateRequest
]; 