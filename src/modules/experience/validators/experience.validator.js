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
    .isIn(['start_date', 'end_date', 'company', 'title', 'created_at', 'updated_at'])
    .withMessage('Sort by must be one of: start_date, end_date, company, title, created_at, updated_at'),
  
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be one of: asc, desc'),
    
  query('search')
    .optional()
    .isString()
    .withMessage('Search term must be a string'),
    
  query('technology')
    .optional()
    .isString()
    .withMessage('Technology filter must be a string'),
    
  query('company')
    .optional()
    .isString()
    .withMessage('Company filter must be a string'),
    
  query('startDateFrom')
    .optional()
    .isISO8601()
    .withMessage('Start date from must be a valid date'),
    
  query('startDateTo')
    .optional()
    .isISO8601()
    .withMessage('Start date to must be a valid date'),
    
  query('endDateFrom')
    .optional()
    .isISO8601()
    .withMessage('End date from must be a valid date'),
    
  query('endDateTo')
    .optional()
    .isISO8601()
    .withMessage('End date to must be a valid date'),
    
  query('isCurrentOnly')
    .optional()
    .isBoolean()
    .withMessage('isCurrentOnly must be a boolean')
    .toBoolean()
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
    .withMessage('Offset must be a non-negative integer'),
    
  query('technology')
    .optional()
    .isString()
    .withMessage('Technology filter must be a string')
];

// Validator for getting experiences by technology
exports.getExperiencesByTechnology = [
  param('technology')
    .isString()
    .withMessage('Technology must be a string')
    .isLength({ min: 1, max: 50 })
    .withMessage('Technology name must be between 1 and 50 characters'),
    
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
    .withMessage('Start date must be a valid date'),
    
  body('experiences.*.end_date')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((endDate, { req, path }) => {
      // Extract the index from the path (e.g., experiences[0].end_date)
      const match = path.match(/experiences\[(\d+)\]\.end_date/);
      if (!match) return true;
      
      const index = parseInt(match[1], 10);
      const startDate = req.body.experiences[index].start_date;
      
      if (endDate && startDate && new Date(endDate) < new Date(startDate)) {
        throw new Error(`End date must be after start date for experience at position ${index + 1}`);
      }
      return true;
    }),
    
  body('experiences.*.technologies')
    .optional()
    .isArray()
    .withMessage('Technologies must be an array'),
    
  body('experiences.*.technologies.*')
    .optional()
    .isString()
    .withMessage('Each technology must be a string')
    .isLength({ max: 50 })
    .withMessage('Technology name must not exceed 50 characters')
];

// Validator for bulk updating experiences
exports.bulkUpdateExperiences = [
  body('experiences')
    .isArray({ min: 1 })
    .withMessage('Experiences must be a non-empty array'),
    
  body('experiences.*.id')
    .isInt({ min: 1 })
    .withMessage('Each experience must have a valid ID'),
    
  body('experiences.*.title')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Job title must be between 2 and 100 characters'),
    
  body('experiences.*.company')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters'),
    
  body('experiences.*.start_date')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
    
  body('experiences.*.end_date')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((endDate, { req, path }) => {
      if (!endDate) return true;
      
      // Extract the index from the path
      const match = path.match(/experiences\[(\d+)\]\.end_date/);
      if (!match) return true;
      
      const index = parseInt(match[1], 10);
      const experience = req.body.experiences[index];
      const startDate = experience.start_date;
      
      if (startDate && new Date(endDate) < new Date(startDate)) {
        throw new Error(`End date must be after start date for experience at position ${index + 1}`);
      }
      return true;
    })
];

// Validator for bulk deleting experiences
exports.bulkDeleteExperiences = [
  body('ids')
    .isArray({ min: 1 })
    .withMessage('IDs must be a non-empty array'),
    
  body('ids.*')
    .isInt({ min: 1 })
    .withMessage('Each ID must be a positive integer')
]; 