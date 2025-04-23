const { body, query, param, validationResult } = require('express-validator');

/**
 * Validate search projects request
 */
exports.validateSearchProjects = [
  query('query').isString().withMessage('Search query must be a string').trim(),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('sort').optional().isIn([
    'created_at', 'updated_at', 'title', 'start_date', 'end_date', 'display_order'
  ]).withMessage('Invalid sort field'),
  query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
        message: 'Validation error',
        timestamp: new Date().toISOString()
      });
    }
    next();
  }
];

/**
 * Validate advanced filtering
 */
exports.validateAdvancedFilter = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('sort').optional().isIn([
    'created_at', 'updated_at', 'title', 'start_date', 'end_date', 'display_order'
  ]).withMessage('Invalid sort field'),
  query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc'),
  query('status').optional().isIn(['draft', 'in_progress', 'completed', 'archived']).withMessage('Invalid status'),
  query('featured').optional().isBoolean().withMessage('Featured must be a boolean'),
  query('technologies').optional(),
  query('tags').optional(),
  query('startDateFrom').optional().isISO8601().withMessage('Start date from must be a valid date'),
  query('startDateTo').optional().isISO8601().withMessage('Start date to must be a valid date'),
  query('endDateFrom').optional().isISO8601().withMessage('End date from must be a valid date'),
  query('endDateTo').optional().isISO8601().withMessage('End date to must be a valid date'),
  query('hasGithub').optional().isBoolean().withMessage('Has Github must be a boolean'),
  query('hasLiveUrl').optional().isBoolean().withMessage('Has Live URL must be a boolean'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
        message: 'Validation error',
        timestamp: new Date().toISOString()
      });
    }
    
    // Process arrays from query strings
    if (req.query.technologies && typeof req.query.technologies === 'string') {
      req.query.technologies = req.query.technologies.split(',').map(tech => tech.trim());
    }
    
    if (req.query.tags && typeof req.query.tags === 'string') {
      req.query.tags = req.query.tags.split(',').map(tag => tag.trim());
    }
    
    next();
  }
];

/**
 * Validate get related projects request
 */
exports.validateGetRelatedProjects = [
  param('id').isInt({ min: 1 }).withMessage('Project ID must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
        message: 'Validation error',
        timestamp: new Date().toISOString()
      });
    }
    next();
  }
];

/**
 * Validate export project request
 */
exports.validateExportProject = [
  param('id').isInt({ min: 1 }).withMessage('Project ID must be a positive integer'),
  query('format').optional().isIn(['json', 'csv']).withMessage('Format must be json or csv'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
        message: 'Validation error',
        timestamp: new Date().toISOString()
      });
    }
    next();
  }
];

/**
 * Validate manage featured project request
 */
exports.validateManageFeaturedProject = [
  param('id').isInt({ min: 1 }).withMessage('Project ID must be a positive integer'),
  body('featured').isBoolean().withMessage('Featured must be a boolean'),
  body('displayOrder').optional().isInt({ min: 0 }).withMessage('Display order must be a non-negative integer'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
        message: 'Validation error',
        timestamp: new Date().toISOString()
      });
    }
    next();
  }
]; 