/**
 * Media Optimization Validator
 * Contains validation rules for media optimization operations
 */
const { body, param } = require('express-validator');

exports.optimizeMedia = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Media ID must be a positive integer'),
  
  body('width')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Width must be between 1 and 10000 pixels'),
  
  body('height')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Height must be between 1 and 10000 pixels'),
  
  body('quality')
    .optional()
    .isInt({ min: 10, max: 100 })
    .withMessage('Quality must be between 10 and 100'),
  
  body('format')
    .optional()
    .isIn(['webp', 'jpeg', 'jpg', 'png', 'avif'])
    .withMessage('Format must be one of: webp, jpeg, jpg, png, avif'),
  
  body('crop')
    .optional()
    .isBoolean()
    .withMessage('Crop must be a boolean value')
];

exports.optimizeImage = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Media ID must be a positive integer'),
  
  body('width')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Width must be between 1 and 10000 pixels'),
  
  body('height')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Height must be between 1 and 10000 pixels'),
  
  body('quality')
    .optional()
    .isInt({ min: 10, max: 100 })
    .withMessage('Quality must be between 10 and 100'),
  
  body('format')
    .optional()
    .isIn(['webp', 'jpeg', 'jpg', 'png', 'avif'])
    .withMessage('Format must be one of: webp, jpeg, jpg, png, avif'),
  
  body('crop')
    .optional()
    .isBoolean()
    .withMessage('Crop must be a boolean value')
];

exports.getOptimizationStatus = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Media ID must be a positive integer')
]; 