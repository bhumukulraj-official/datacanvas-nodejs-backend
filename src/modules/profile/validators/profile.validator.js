const { body, validationResult } = require('express-validator');
const { ValidationError } = require('../../../shared/errors');

/**
 * Middleware to check validation results
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation error', errors.array());
  }
  next();
};

/**
 * Validator for updating profile
 */
exports.updateProfile = [
  // Personal Info validation
  body('personalInfo')
    .isObject()
    .withMessage('Personal info must be an object'),
  
  body('personalInfo.name')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name must be at most 100 characters'),
  
  body('personalInfo.title')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Title must be at most 100 characters'),
  
  body('personalInfo.bio')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Bio must be at most 1000 characters'),
  
  body('personalInfo.email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  
  body('personalInfo.phone')
    .optional()
    .isString()
    .trim()
    .matches(/^[+]?[0-9]{10,15}$/)
    .withMessage('Phone must be a valid phone number with 10-15 digits, optionally starting with +'),
  
  body('personalInfo.location')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location must be at most 100 characters'),
  
  body('personalInfo.website')
    .optional()
    .isURL()
    .withMessage('Website must be a valid URL')
    .matches(/^https?:\/\/[\w.-]+(?:\.[\w.-]+)+[\w\-._~:/?#[\]@!$&'()*+,;=]*$/)
    .withMessage('Website must be a valid URL format')
    .trim(),
  
  // Social Links validation
  body('socialLinks')
    .optional()
    .isObject()
    .withMessage('Social links must be an object with platform keys'),
  
  body('socialLinks.*.platform')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Platform is required')
    .isIn(['github', 'linkedin', 'twitter', 'facebook', 'instagram', 'dribbble', 'behance', 'youtube', 'medium', 'codepen', 'stackoverflow'])
    .withMessage('Invalid social media platform'),
  
  body('socialLinks.*.url')
    .optional()
    .isURL()
    .withMessage('Social link URL must be a valid URL')
    .trim(),
  
  body('socialLinks.*.icon')
    .optional()
    .isString()
    .trim(),
  
  validateRequest
];

/**
 * Validator for avatar upload - minimal because file validation is handled in middleware
 */
exports.uploadAvatar = [
  // No body validation needed as this is handled by multer middleware
  validateRequest
];

/**
 * Validator for resume upload - minimal because file validation is handled in middleware
 */
exports.uploadResume = [
  // No body validation needed as this is handled by multer middleware
  validateRequest
];

/**
 * Validator for getting profile - no validation needed
 */
exports.getProfile = [
  validateRequest
]; 