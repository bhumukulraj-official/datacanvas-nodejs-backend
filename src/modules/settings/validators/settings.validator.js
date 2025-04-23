const { body, param } = require('express-validator');

/**
 * Validation for getting settings by key
 */
exports.getSettingsByKey = [
  param('key')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Settings key is required')
];

/**
 * Validation for updating general settings
 */
exports.updateSettings = [
  body('site_name')
    .optional()
    .isString()
    .isLength({ min: 2, max: 100 })
    .withMessage('Site name must be between 2 and 100 characters'),
  
  body('site_description')
    .optional()
    .isString()
    .withMessage('Site description must be a string'),
  
  body('logo_url')
    .optional()
    .isURL()
    .withMessage('Logo URL must be a valid URL'),
  
  body('favicon_url')
    .optional()
    .isURL()
    .withMessage('Favicon URL must be a valid URL'),
  
  body('theme')
    .optional()
    .isObject()
    .withMessage('Theme must be an object'),
  
  body('contact_info')
    .optional()
    .isObject()
    .withMessage('Contact info must be an object'),
  
  body('social_links')
    .optional()
    .isObject()
    .withMessage('Social links must be an object'),
  
  body('seo_settings')
    .optional()
    .isObject()
    .withMessage('SEO settings must be an object'),
  
  body('analytics_settings')
    .optional()
    .isObject()
    .withMessage('Analytics settings must be an object'),
  
  body('theme_options')
    .optional()
    .isObject()
    .withMessage('Theme options must be an object'),
  
  body('privacy_settings')
    .optional()
    .isObject()
    .withMessage('Privacy settings must be an object'),
  
  body('notification_settings')
    .optional()
    .isObject()
    .withMessage('Notification settings must be an object'),
  
  body('caching_settings')
    .optional()
    .isObject()
    .withMessage('Caching settings must be an object'),
  
  body('security_settings')
    .optional()
    .isObject()
    .withMessage('Security settings must be an object')
];

/**
 * Validation for updating settings by key
 */
exports.updateSettingsByKey = [
  param('key')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Settings key is required'),
  
  body()
    .notEmpty()
    .withMessage('Settings data is required')
]; 