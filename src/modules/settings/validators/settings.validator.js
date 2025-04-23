const { body, param, query } = require('express-validator');
const Joi = require('joi');

/**
 * Settings Validator
 * Comprehensive validation rules for settings operations
 */

// JSON schema validation helpers
const validateJsonStructure = (value, { req }) => {
  if (!value || typeof value !== 'object') {
    throw new Error('Must be a valid JSON object');
  }
  return true;
};

// Color validation for hex colors
const validateHexColor = (value) => {
  if (!value) return true;
  const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  if (!hexColorRegex.test(value)) {
    throw new Error('Must be a valid hex color (e.g., #ff0000)');
  }
  return true;
};

// URI validation
const validateUri = (value) => {
  if (!value) return true;
  try {
    new URL(value);
    return true;
  } catch (error) {
    throw new Error('Must be a valid URL');
  }
};

// Basic schema validators for different settings fields
exports.validateTheme = [
  body('primary_color')
    .optional()
    .custom(validateHexColor),
  body('secondary_color')
    .optional()
    .custom(validateHexColor),
  body('font_family')
    .optional()
    .isString()
    .withMessage('Font family must be a string'),
  body('dark_mode')
    .optional()
    .isBoolean()
    .withMessage('Dark mode must be a boolean value')
];

exports.validateContactInfo = [
  body('email')
    .optional()
    .isEmail()
    .withMessage('Must be a valid email address'),
  body('phone')
    .optional()
    .isString()
    .withMessage('Phone must be a string'),
  body('address')
    .optional()
    .isString()
    .withMessage('Address must be a string')
];

exports.validateSocialLinks = [
  body()
    .custom((value) => {
      // Each key should have a valid URL as value
      for (const [key, val] of Object.entries(value)) {
        if (typeof val !== 'string') {
          throw new Error(`Social link '${key}' must be a string URL`);
        }
        try {
          new URL(val);
        } catch (e) {
          throw new Error(`Social link '${key}' must be a valid URL`);
        }
      }
      return true;
    })
];

/**
 * Validation for getting settings by key
 */
exports.getSettingsByKey = [
  param('key')
    .isString()
    .withMessage('Key must be a string')
    .isIn([
      'site_name',
      'site_description',
      'logo_url',
      'favicon_url',
      'theme',
      'contact_info',
      'social_links',
      'seo_settings',
      'analytics_settings',
      'theme_options',
      'privacy_settings',
      'notification_settings',
      'caching_settings',
      'security_settings'
    ])
    .withMessage('Invalid settings key')
];

/**
 * Validation for updating general settings
 */
exports.updateSettings = [
  body('site_name')
    .optional()
    .isString()
    .withMessage('Site name must be a string')
    .isLength({ min: 2, max: 100 })
    .withMessage('Site name must be between 2 and 100 characters'),
  
  body('site_description')
    .optional()
    .isString()
    .withMessage('Site description must be a string'),
  
  body('logo_url')
    .optional()
    .isURL()
    .withMessage('Logo URL must be a valid URL')
    .isLength({ max: 255 })
    .withMessage('Logo URL must not exceed 255 characters'),
  
  body('favicon_url')
    .optional()
    .isURL()
    .withMessage('Favicon URL must be a valid URL')
    .isLength({ max: 255 })
    .withMessage('Favicon URL must not exceed 255 characters'),
  
  body('theme')
    .optional()
    .isObject()
    .withMessage('Theme must be an object')
    .custom(validateJsonStructure),
  
  body('theme.primary_color')
    .optional()
    .custom(validateHexColor),
  
  body('theme.secondary_color')
    .optional()
    .custom(validateHexColor),
  
  body('theme.font_family')
    .optional()
    .isString()
    .withMessage('Font family must be a string'),
  
  body('theme.dark_mode')
    .optional()
    .isBoolean()
    .withMessage('Dark mode must be a boolean value'),
  
  body('contact_info')
    .optional()
    .isObject()
    .withMessage('Contact info must be an object')
    .custom(validateJsonStructure),
  
  body('contact_info.email')
    .optional()
    .isEmail()
    .withMessage('Contact email must be a valid email address'),
  
  body('social_links')
    .optional()
    .isObject()
    .withMessage('Social links must be an object')
    .custom(validateJsonStructure),
  
  body('social_links.*')
    .optional()
    .custom(validateUri)
    .withMessage('Social link must be a valid URL'),
  
  body('seo_settings')
    .optional()
    .isObject()
    .withMessage('SEO settings must be an object')
    .custom(validateJsonStructure),
  
  body('seo_settings.meta_title')
    .optional()
    .isString()
    .withMessage('Meta title must be a string'),
  
  body('seo_settings.meta_description')
    .optional()
    .isString()
    .withMessage('Meta description must be a string'),
  
  body('analytics_settings')
    .optional()
    .isObject()
    .withMessage('Analytics settings must be an object')
    .custom(validateJsonStructure),
  
  body('analytics_settings.enable_analytics')
    .optional()
    .isBoolean()
    .withMessage('Enable analytics must be a boolean value'),
  
  body('theme_options')
    .optional()
    .isObject()
    .withMessage('Theme options must be an object')
    .custom(validateJsonStructure),
  
  body('privacy_settings')
    .optional()
    .isObject()
    .withMessage('Privacy settings must be an object')
    .custom(validateJsonStructure),
  
  body('notification_settings')
    .optional()
    .isObject()
    .withMessage('Notification settings must be an object')
    .custom(validateJsonStructure),
  
  body('caching_settings')
    .optional()
    .isObject()
    .withMessage('Caching settings must be an object')
    .custom(validateJsonStructure),
  
  body('caching_settings.cache_duration_seconds')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Cache duration must be a non-negative integer'),
  
  body('security_settings')
    .optional()
    .isObject()
    .withMessage('Security settings must be an object')
    .custom(validateJsonStructure),
  
  body('security_settings.enable_rate_limiting')
    .optional()
    .isBoolean()
    .withMessage('Enable rate limiting must be a boolean value'),
  
  body('security_settings.max_login_attempts')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max login attempts must be a positive integer')
];

/**
 * Validation for updating settings by key
 */
exports.updateSettingsByKey = [
  param('key')
    .isString()
    .withMessage('Key must be a string')
    .isIn([
      'site_name',
      'site_description',
      'logo_url',
      'favicon_url',
      'theme',
      'contact_info',
      'social_links',
      'seo_settings',
      'analytics_settings',
      'theme_options',
      'privacy_settings',
      'notification_settings',
      'caching_settings',
      'security_settings'
    ])
    .withMessage('Invalid settings key'),
  
  body()
    .custom((value, { req }) => {
      const key = req.params.key;
      
      // For non-object fields, basic validation is sufficient
      if (['site_name', 'site_description', 'logo_url', 'favicon_url'].includes(key)) {
        return true;
      }
      
      // For object fields, validate the structure
      if (typeof value !== 'object') {
        throw new Error(`${key} must be a valid JSON object`);
      }
      
      return true;
    })
];

exports.exportSettings = [
  query('format')
    .optional()
    .isIn(['json', 'yaml'])
    .withMessage('Format must be either json or yaml')
    .default('json')
];

exports.importSettings = [
  body()
    .custom((value) => {
      if (!value || typeof value !== 'object') {
        throw new Error('Import data must be a valid JSON object');
      }
      return true;
    })
]; 