/**
 * Education Validator
 * Contains validation rules for education operations
 */
const { body, param, query } = require('express-validator');

exports.createEducation = [
  body('institution')
    .notEmpty()
    .withMessage('Institution name is required')
    .isLength({ max: 255 })
    .withMessage('Institution name must not exceed 255 characters'),
  
  body('degree')
    .notEmpty()
    .withMessage('Degree is required')
    .isLength({ max: 100 })
    .withMessage('Degree must not exceed 100 characters'),
  
  body('field_of_study')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Field of study must not exceed 100 characters'),
  
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
      if (endDate && req.body.start_date && new Date(endDate) < new Date(req.body.start_date)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  
  body('is_current')
    .optional()
    .isBoolean()
    .withMessage('Is current must be a boolean value')
    .custom((isCurrent, { req }) => {
      if (isCurrent === true && req.body.end_date) {
        throw new Error('End date should not be provided if education is current');
      }
      return true;
    }),
  
  body('grade')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Grade must not exceed 20 characters'),
  
  body('activities')
    .optional()
    .isString()
    .withMessage('Activities must be a string'),
  
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string'),
  
  body('location')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Location must not exceed 100 characters')
];

exports.updateEducation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Education ID must be a positive integer'),
  
  body('institution')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Institution name must not exceed 255 characters'),
  
  body('degree')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Degree must not exceed 100 characters'),
  
  body('field_of_study')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Field of study must not exceed 100 characters'),
  
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
  
  body('is_current')
    .optional()
    .isBoolean()
    .withMessage('Is current must be a boolean value')
    .custom((isCurrent, { req }) => {
      if (isCurrent === true && req.body.end_date) {
        throw new Error('End date should not be provided if education is current');
      }
      return true;
    }),
  
  body('grade')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Grade must not exceed 20 characters'),
  
  body('activities')
    .optional()
    .isString()
    .withMessage('Activities must be a string'),
  
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string'),
  
  body('location')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Location must not exceed 100 characters')
];

exports.getEducationById = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Education ID must be a positive integer')
];

exports.deleteEducation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Education ID must be a positive integer')
];

exports.getEducation = [
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
    .isIn(['start_date', 'end_date', 'institution', 'degree'])
    .withMessage('Sort by must be one of: start_date, end_date, institution, degree'),
  
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be one of: asc, desc')
]; 