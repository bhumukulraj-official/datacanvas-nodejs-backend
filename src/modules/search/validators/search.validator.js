/**
 * Search Validator
 * Contains validation rules for search operations
 */
const { query, param } = require('express-validator');

/**
 * Validation for global search
 */
exports.globalSearch = [
  query('q')
    .notEmpty()
    .withMessage('Search query is required')
    .isLength({ min: 2 })
    .withMessage('Search query must be at least 2 characters long'),
  
  query('types')
    .optional()
    .isArray()
    .withMessage('Types must be an array')
    .custom((value) => {
      const validTypes = ['projects', 'blog', 'education', 'experience', 'skills', 'testimonials'];
      if (value && value.length > 0) {
        const allValid = value.every(type => validTypes.includes(type));
        if (!allValid) {
          throw new Error(`Types must be one or more of: ${validTypes.join(', ')}`);
        }
      }
      return true;
    }),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer')
];

/**
 * Validation for content type specific search
 */
exports.searchByContentType = [
  param('contentType')
    .isString()
    .trim()
    .notEmpty()
    .isIn(['projects', 'blog', 'skills', 'experience', 'education', 'testimonials'])
    .withMessage('Content type must be one of: projects, blog, skills, experience, education, testimonials'),
  
  query('q')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Search query is required'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer')
    .toInt(),
  
  query('sort')
    .optional()
    .isIn(['relevance', 'date', 'title'])
    .withMessage('Sort must be relevance, date, or title'),
  
  query('filters')
    .optional()
    .isJSON()
    .withMessage('Filters must be a valid JSON')
]; 