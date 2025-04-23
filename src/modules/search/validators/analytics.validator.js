/**
 * Search Analytics Validators
 * Contains validation rules for search analytics operations
 */
const { query } = require('express-validator');

/**
 * Validation for getting popular searches
 */
exports.getPopularSearches = [
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days must be between 1 and 365'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('contentType')
    .optional()
    .isString()
    .isIn(['projects', 'blog', 'skills', 'experience', 'education', 'testimonials'])
    .withMessage('Content type must be one of: projects, blog, skills, experience, education, testimonials')
];

/**
 * Validation for getting zero-result searches
 */
exports.getZeroResultSearches = [
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days must be between 1 and 365'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('contentType')
    .optional()
    .isString()
    .isIn(['projects', 'blog', 'skills', 'experience', 'education', 'testimonials'])
    .withMessage('Content type must be one of: projects, blog, skills, experience, education, testimonials')
];

/**
 * Validation for getting search trends
 */
exports.getSearchTrends = [
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days must be between 1 and 365'),
  
  query('interval')
    .optional()
    .isString()
    .isIn(['hour', 'day', 'week', 'month'])
    .withMessage('Interval must be one of: hour, day, week, month'),
  
  query('contentType')
    .optional()
    .isString()
    .isIn(['projects', 'blog', 'skills', 'experience', 'education', 'testimonials'])
    .withMessage('Content type must be one of: projects, blog, skills, experience, education, testimonials')
];

/**
 * Validation for getting user search history
 */
exports.getUserSearchHistory = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
];

/**
 * Validation for getting search statistics
 */
exports.getSearchStats = [
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days must be between 1 and 365'),
  
  query('contentType')
    .optional()
    .isString()
    .isIn(['projects', 'blog', 'skills', 'experience', 'education', 'testimonials'])
    .withMessage('Content type must be one of: projects, blog, skills, experience, education, testimonials')
]; 