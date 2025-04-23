/**
 * Skill Validator
 * Contains validation rules for skill operations
 */
const { body, param, query } = require('express-validator');

exports.createSkill = [
  body('name')
    .notEmpty()
    .withMessage('Skill name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Skill name must be between 2 and 100 characters'),
  
  body('category')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Category must be at most 50 characters'),
  
  body('proficiency')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Proficiency must be between 0 and 100'),
  
  body('icon')
    .optional()
    .isURL()
    .withMessage('Icon must be a valid URL'),
  
  body('is_highlighted')
    .optional()
    .isBoolean()
    .withMessage('is_highlighted must be a boolean value'),
  
  body('display_order')
    .optional()
    .isInt()
    .withMessage('Display order must be an integer'),
  
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string'),
  
  body('years_of_experience')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Years of experience must be a positive number'),
  
  body('last_used_date')
    .optional()
    .isISO8601()
    .withMessage('Last used date must be a valid date'),
  
  body('certification_url')
    .optional()
    .isURL()
    .withMessage('Certification URL must be a valid URL')
];

exports.updateSkill = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Skill ID must be a positive integer'),
  
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Skill name must be between 2 and 100 characters'),
  
  body('category')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Category must be at most 50 characters'),
  
  body('proficiency')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Proficiency must be between 0 and 100'),
  
  body('icon')
    .optional()
    .isURL()
    .withMessage('Icon must be a valid URL'),
  
  body('is_highlighted')
    .optional()
    .isBoolean()
    .withMessage('is_highlighted must be a boolean value'),
  
  body('display_order')
    .optional()
    .isInt()
    .withMessage('Display order must be an integer'),
  
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string'),
  
  body('years_of_experience')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Years of experience must be a positive number'),
  
  body('last_used_date')
    .optional()
    .isISO8601()
    .withMessage('Last used date must be a valid date'),
  
  body('certification_url')
    .optional()
    .isURL()
    .withMessage('Certification URL must be a valid URL')
];

exports.getSkillById = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Skill ID must be a positive integer')
];

exports.deleteSkill = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Skill ID must be a positive integer')
];

exports.getSkills = [
  query('category')
    .optional()
    .isString()
    .withMessage('Category must be a string'),
  
  query('is_highlighted')
    .optional()
    .isBoolean()
    .withMessage('is_highlighted must be a boolean value'),
  
  query('search')
    .optional()
    .isString()
    .withMessage('Search query must be a string'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer')
];

exports.updateSkillOrder = [
  body('skillsOrder')
    .isArray()
    .withMessage('Skills order must be an array'),
  
  body('skillsOrder.*.id')
    .isInt({ min: 1 })
    .withMessage('Each skill ID must be a positive integer'),
  
  body('skillsOrder.*.displayOrder')
    .isInt({ min: 0 })
    .withMessage('Each display order must be a non-negative integer')
]; 