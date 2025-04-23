const { body, query, param, validationResult } = require('express-validator');
const { AppError } = require('../../../shared/errors');
const Media = require('../models/Media');

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
 * Validate media upload request
 */
exports.validateMediaUpload = [
  body('type')
    .isIn(Media.MEDIA_TYPES)
    .withMessage(`Media type must be one of: ${Media.MEDIA_TYPES.join(', ')}`),
  
  body('description')
    .optional()
    .isString()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Description must be between 1 and 1000 characters'),
  
  body('visibility')
    .optional()
    .isIn(Media.VISIBILITY_TYPES)
    .withMessage(`Visibility must be one of: ${Media.VISIBILITY_TYPES.join(', ')}`),
  
  handleValidationErrors
];

/**
 * Validate list media request
 */
exports.validateListMedia = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('type')
    .optional()
    .isIn(Media.MEDIA_TYPES)
    .withMessage(`Type must be one of: ${Media.MEDIA_TYPES.join(', ')}`),
  
  query('search')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  
  handleValidationErrors
];

/**
 * Validate media ID parameter
 */
exports.validateMediaId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Media ID must be a positive integer'),
  
  handleValidationErrors
];

/**
 * Validate media optimization request
 */
exports.validateMediaOptimization = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Media ID must be a positive integer'),
  
  body('quality')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Quality must be between 1 and 100'),
  
  body('format')
    .optional()
    .isIn(['jpg', 'png', 'webp', 'gif'])
    .withMessage('Format must be one of: jpg, png, webp, gif'),
  
  body('width')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Width must be between 1 and 10000 pixels'),
  
  body('height')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Height must be between 1 and 10000 pixels'),
  
  handleValidationErrors
];

exports.validateAdvancedSearch = [
  query('query')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  query('type')
    .optional()
    .isIn(Media.MEDIA_TYPES)
    .withMessage(`Type must be one of: ${Media.MEDIA_TYPES.join(', ')}`),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO date'),
  query('minSize')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Minimum size must be a non-negative integer'),
  query('maxSize')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Maximum size must be a positive integer'),
  query('status')
    .optional()
    .isIn(Media.MEDIA_STATUSES)
    .withMessage(`Status must be one of: ${Media.MEDIA_STATUSES.join(', ')}`),
  query('optimized')
    .optional()
    .isBoolean()
    .withMessage('Optimized must be a boolean'),
  query('sortBy')
    .optional()
    .isIn(['uploadedAt', 'size', 'filename', 'type', 'createdAt'])
    .withMessage('Sort by must be one of: uploadedAt, size, filename, type, createdAt'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either asc or desc'),
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

exports.validateBatchOperations = [
  body('operation')
    .isIn(['delete', 'optimize'])
    .withMessage('Operation must be one of: delete, optimize'),
  body('mediaIds')
    .isArray({ min: 1, max: 100 })
    .withMessage('Media IDs must be an array with 1-100 items'),
  body('mediaIds.*')
    .isInt({ min: 1 })
    .withMessage('Each media ID must be a positive integer'),
  body('options')
    .optional()
    .isObject()
    .withMessage('Options must be an object'),
  body('options.quality')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Quality must be between 1 and 100'),
  body('options.format')
    .optional()
    .isIn(['jpg', 'png', 'webp', 'gif'])
    .withMessage('Format must be one of: jpg, png, webp, gif'),
  handleValidationErrors
];

exports.validateMediaAssociation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Media ID must be a positive integer'),
  body('entityType')
    .isIn(['project', 'blog', 'profile', 'testimonial'])
    .withMessage('Entity type must be one of: project, blog, profile, testimonial'),
  body('entityId')
    .isInt({ min: 1 })
    .withMessage('Entity ID must be a positive integer'),
  body('relationshipType')
    .optional()
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('Relationship type must be between 1 and 50 characters'),
  handleValidationErrors
];

exports.validateTemporaryUrl = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Media ID must be a positive integer'),
  query('expiresIn')
    .optional()
    .isInt({ min: 60, max: 86400 }) // Between 1 minute and 24 hours
    .withMessage('Expiration time must be between 60 and 86400 seconds'),
  handleValidationErrors
];

exports.validateMediaAccess = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Media ID must be a positive integer'),
  query('token')
    .optional()
    .isString()
    .isLength({ min: 32, max: 128 })
    .withMessage('Invalid token format'),
  handleValidationErrors
]; 