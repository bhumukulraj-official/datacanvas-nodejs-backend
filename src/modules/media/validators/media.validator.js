const { body, query, param, validationResult } = require('express-validator');
const { AppError } = require('../../../shared/errors');

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
    .isIn(['image', 'document', 'video', 'audio'])
    .withMessage('Media type must be one of: image, document, video, audio'),
  
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  
  body('visibility')
    .optional()
    .isIn(['public', 'private'])
    .withMessage('Visibility must be either public or private'),
  
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
    .isIn(['image', 'document', 'video', 'audio'])
    .withMessage('Type must be one of: image, document, video, audio'),
  
  query('search')
    .optional()
    .isString()
    .withMessage('Search must be a string'),
  
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
    .isIn(['jpg', 'jpeg', 'png', 'webp'])
    .withMessage('Format must be one of: jpg, jpeg, png, webp'),
  
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