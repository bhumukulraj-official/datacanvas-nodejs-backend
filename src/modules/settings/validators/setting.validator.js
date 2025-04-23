/**
 * Settings Validator
 * Contains validation rules for settings operations
 */
const { body, param } = require('express-validator');

exports.updateSettings = [
  body('site_name')
    .optional()
    .isString()
    .withMessage('Site name must be a string')
    .isLength({ max: 100 })
    .withMessage('Site name must not exceed 100 characters'),
  
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

exports.updateSingle = [
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
  
  body('value')
    .exists()
    .withMessage('Value is required')
]; 