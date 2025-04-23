const { body, param, validationResult } = require('express-validator');
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
  
  // Remove validation for name and email which don't exist in the Profile model
  // These fields should be updated through the User API instead
  
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
  
  // Social Links validation - Enhanced with stricter validation
  body('socialLinks')
    .optional()
    .isObject()
    .withMessage('Social links must be an object with platform keys'),
  
  // Apply validation to each social link entry
  body('socialLinks.*')
    .optional()
    .custom((value) => {
      if (!value.url || typeof value.url !== 'string') {
        throw new Error('URL is required and must be a string');
      }
      
      // Validate URL format
      const urlRegex = /^https?:\/\/[\w.-]+(?:\.[\w.-]+)+[\w\-._~:/?#[\]@!$&'()*+,;=]*$/;
      if (!urlRegex.test(value.url)) {
        throw new Error('Invalid URL format');
      }
      
      // Validate platform-specific URL patterns
      if (value.platform === 'github' && !value.url.includes('github.com')) {
        throw new Error('GitHub URL must contain github.com');
      }
      if (value.platform === 'linkedin' && !value.url.includes('linkedin.com')) {
        throw new Error('LinkedIn URL must contain linkedin.com');
      }
      if (value.platform === 'twitter' && !value.url.includes('twitter.com') && !value.url.includes('x.com')) {
        throw new Error('Twitter URL must contain twitter.com or x.com');
      }
      // Add more platform validations as needed
      
      return true;
    }),
  
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

/**
 * Validator for deleting avatar
 */
exports.deleteAvatar = [
  validateRequest
];

/**
 * Validator for deleting resume
 */
exports.deleteResume = [
  validateRequest
];

/**
 * Validator for getting public profile by username
 */
exports.getPublicProfile = [
  param('username')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .matches(/^[a-zA-Z0-9_-]{3,50}$/)
    .withMessage('Username must be alphanumeric with underscores or hyphens, 3-50 chars'),
  
  validateRequest
];

/**
 * Validator for checking username availability
 */
exports.checkUsernameAvailability = [
  param('username')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .matches(/^[a-zA-Z0-9_-]{3,50}$/)
    .withMessage('Username must be alphanumeric with underscores or hyphens, 3-50 chars'),
  
  validateRequest
]; 