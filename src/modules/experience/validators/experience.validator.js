/**
 * Experience Validator
 * Contains validation rules for experience operations
 */
const { body, param, query } = require('express-validator');

exports.createExperience = [
  body('title')
    .notEmpty()
    .withMessage('Job title is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Job title must be between 2 and 100 characters'),
  
  body('company')
    .notEmpty()
    .withMessage('Company name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters'),
  
  body('start_date')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  
  body('end_date')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((endDate, { req }) => {
      if (endDate && new Date(endDate) < new Date(req.body.start_date)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string'),
  
  body('technologies')
    .optional()
    .isArray()
    .withMessage('Technologies must be an array'),
  
  body('technologies.*')
    .optional()
    .isString()
    .withMessage('Each technology must be a string')
    .isLength({ max: 50 })
    .withMessage('Technology name must not exceed 50 characters')
];

exports.updateExperience = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Experience ID must be a positive integer'),
  
  body('title')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Job title must be between 2 and 100 characters'),
  
  body('company')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters'),
  
  body('start_date')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  
  body('end_date')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((endDate, { req }) => {
      if (endDate && req.body.start_date && new Date(endDate) < new Date(req.body.start_date)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string'),
  
  body('technologies')
    .optional()
    .isArray()
    .withMessage('Technologies must be an array'),
  
  body('technologies.*')
    .optional()
    .isString()
    .withMessage('Each technology must be a string')
    .isLength({ max: 50 })
    .withMessage('Technology name must not exceed 50 characters')
];

exports.getExperienceById = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Experience ID must be a positive integer')
];

exports.deleteExperience = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Experience ID must be a positive integer')
];

exports.getExperience = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer'),
  
  query('sort_by')
    .optional()
    .isIn(['start_date', 'end_date', 'company'])
    .withMessage('Sort by must be one of: start_date, end_date, company'),
  
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be one of: asc, desc')
];

// Validator for getting public experiences for a user
exports.getUserPublicExperiences = [
  param('userId')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer')
];

// Validator for importing experiences
exports.importExperiences = [
  body('experiences')
    .isArray({ min: 1 })
    .withMessage('Experiences must be a non-empty array'),
  
  body('experiences.*.title')
    .notEmpty()
    .withMessage('Each experience must have a title')
    .isLength({ min: 2, max: 100 })
    .withMessage('Job title must be between 2 and 100 characters'),
  
  body('experiences.*.company')
    .notEmpty()
    .withMessage('Each experience must have a company')
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters'),
  
  body('experiences.*.start_date')
    .notEmpty()
    .withMessage('Each experience must have a start date')
    .isISO8601()
    .withMessage('Start date must be a valid date')
]; 