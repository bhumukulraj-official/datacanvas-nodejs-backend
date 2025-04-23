/**
 * Testimonial Validator
 * Contains validation rules for testimonial operations
 */
const { body, param, query } = require('express-validator');

/**
 * Validation for getting testimonials with filtering
 */
exports.getTestimonials = [
  query('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected'])
    .withMessage('Status must be one of: pending, approved, rejected'),
  
  query('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be a boolean value')
    .toBoolean(),
  
  query('search')
    .optional()
    .isString()
    .withMessage('Search query must be a string'),
  
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
  
  query('order')
    .optional()
    .isJSON()
    .withMessage('Order must be a valid JSON string'),
    
  // New filters for enhanced filtering capabilities
  query('created_from')
    .optional()
    .isISO8601()
    .withMessage('Created from must be a valid date'),
    
  query('created_to')
    .optional()
    .isISO8601()
    .withMessage('Created to must be a valid date'),
    
  query('reviewed_from')
    .optional()
    .isISO8601()
    .withMessage('Reviewed from must be a valid date'),
    
  query('reviewed_to')
    .optional()
    .isISO8601()
    .withMessage('Reviewed to must be a valid date'),
    
  query('sort_by')
    .optional()
    .isIn(['created_at', 'updated_at', 'rating', 'author_name', 'display_order'])
    .withMessage('Sort by must be one of: created_at, updated_at, rating, author_name, display_order'),
    
  query('sort_order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either asc or desc')
];

/**
 * Validation for getting testimonial by ID
 */
exports.getTestimonialById = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Testimonial ID must be a positive integer')
    .toInt()
];

/**
 * Validation for getting featured testimonials
 */
exports.getFeaturedTestimonials = [
  param('userId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer')
    .toInt()
];

/**
 * Validation for creating a testimonial
 */
exports.createTestimonial = [
  body('author_name')
    .notEmpty()
    .withMessage('Author name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Author name must be between 2 and 100 characters'),
  
  body('author_title')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Author title must not exceed 100 characters'),
  
  body('company')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Company must not exceed 100 characters'),
  
  body('content')
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters long'),
  
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5')
    .toInt(),
  
  body('avatar_url')
    .optional()
    .isURL()
    .withMessage('Avatar URL must be a valid URL'),
  
  body('website')
    .optional()
    .isURL()
    .withMessage('Website must be a valid URL'),
  
  body('is_featured')
    .optional()
    .isBoolean()
    .withMessage('Is featured must be a boolean value')
    .toBoolean(),
    
  body('display_order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Display order must be a non-negative integer')
    .toInt()
];

/**
 * Validation for updating a testimonial
 */
exports.updateTestimonial = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Testimonial ID must be a positive integer')
    .toInt(),
  
  body('author_name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Author name must be between 2 and 100 characters'),
  
  body('author_title')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Author title must not exceed 100 characters'),
  
  body('company')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Company must not exceed 100 characters'),
  
  body('content')
    .optional()
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters long'),
  
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5')
    .toInt(),
  
  body('avatar_url')
    .optional()
    .isURL()
    .withMessage('Avatar URL must be a valid URL'),
  
  body('website')
    .optional()
    .isURL()
    .withMessage('Website must be a valid URL'),
  
  body('is_featured')
    .optional()
    .isBoolean()
    .withMessage('Is featured must be a boolean value')
    .toBoolean(),
    
  body('display_order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Display order must be a non-negative integer')
    .toInt(),
    
  body('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected'])
    .withMessage('Status must be one of: pending, approved, rejected')
];

/**
 * Validation for deleting a testimonial
 */
exports.deleteTestimonial = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Testimonial ID must be a positive integer')
    .toInt()
];

/**
 * Validation for updating testimonial status
 */
exports.updateTestimonialStatus = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Testimonial ID must be a positive integer')
    .toInt(),
  
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['pending', 'approved', 'rejected'])
    .withMessage('Status must be one of: pending, approved, rejected')
];

/**
 * Validation for updating testimonial order
 */
exports.updateTestimonialOrder = [
  body('testimonialsOrder')
    .isArray()
    .withMessage('Testimonials order must be an array'),
  
  body('testimonialsOrder.*.id')
    .isInt({ min: 1 })
    .withMessage('Testimonial ID must be a positive integer')
    .toInt(),
  
  body('testimonialsOrder.*.displayOrder')
    .isInt({ min: 0 })
    .withMessage('Display order must be a non-negative integer')
    .toInt()
];

/**
 * Validation for bulk create testimonials
 */
exports.bulkCreateTestimonials = [
  body('testimonials')
    .isArray({ min: 1 })
    .withMessage('Testimonials must be a non-empty array'),
    
  body('testimonials.*.author_name')
    .notEmpty()
    .withMessage('Author name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Author name must be between 2 and 100 characters'),
  
  body('testimonials.*.author_title')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Author title must not exceed 100 characters'),
  
  body('testimonials.*.company')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Company must not exceed 100 characters'),
  
  body('testimonials.*.content')
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters long'),
  
  body('testimonials.*.rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
    
  body('testimonials.*.avatar_url')
    .optional()
    .isURL()
    .withMessage('Avatar URL must be a valid URL'),
  
  body('testimonials.*.website')
    .optional()
    .isURL()
    .withMessage('Website must be a valid URL')
];

/**
 * Validation for bulk update testimonials
 */
exports.bulkUpdateTestimonials = [
  body('testimonials')
    .isArray({ min: 1 })
    .withMessage('Testimonials must be a non-empty array'),
    
  body('testimonials.*.id')
    .isInt({ min: 1 })
    .withMessage('Testimonial ID must be a positive integer'),
    
  body('testimonials.*.author_name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Author name must be between 2 and 100 characters'),
  
  body('testimonials.*.author_title')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Author title must not exceed 100 characters'),
  
  body('testimonials.*.content')
    .optional()
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters long')
];

/**
 * Validation for bulk delete testimonials
 */
exports.bulkDeleteTestimonials = [
  body('ids')
    .isArray({ min: 1 })
    .withMessage('IDs must be a non-empty array'),
    
  body('ids.*')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer')
];

/**
 * Validation for export testimonials
 */
exports.exportTestimonials = [
  query('format')
    .optional()
    .isIn(['json', 'csv', 'pdf'])
    .withMessage('Format must be one of: json, csv, pdf')
    .default('json'),
    
  query('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected', 'all'])
    .withMessage('Status must be one of: pending, approved, rejected, all'),
    
  query('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be a boolean value')
    .toBoolean()
];

/**
 * Validation for getting testimonial statistics
 */
exports.getTestimonialStatistics = [
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO date'),
    
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO date')
    .custom((endDate, { req }) => {
      if (endDate && req.query.start_date && new Date(endDate) < new Date(req.query.start_date)) {
        throw new Error('End date must be after start date');
      }
      return true;
    })
]; 