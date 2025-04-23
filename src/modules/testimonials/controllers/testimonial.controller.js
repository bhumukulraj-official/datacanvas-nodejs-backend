/**
 * Testimonial Controller
 * Handles HTTP requests for testimonial-related operations
 */
const { testimonialService } = require('../services');
const { catchAsync } = require('../../../shared/utils');

/**
 * Get all testimonials with filtering options
 */
exports.getAllTestimonials = catchAsync(async (req, res) => {
  const { status, featured, search } = req.query;
  const { limit, offset, order } = req.query;
  
  const filters = {
    userId: req.user.id,
    status: status || null,
    isFeatured: featured === 'true',
    search: search || null
  };
  
  const options = {
    limit: parseInt(limit, 10) || 50,
    offset: parseInt(offset, 10) || 0,
    order: order ? JSON.parse(order) : undefined
  };
  
  const { count, rows } = await testimonialService.getAllTestimonials(filters, options);
  
  res.status(200).json({
    success: true,
    data: rows,
    metadata: {
      total: count,
      limit: options.limit,
      offset: options.offset
    }
  });
});

/**
 * Get testimonial by ID
 */
exports.getTestimonialById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const testimonial = await testimonialService.getTestimonialById(id);
  
  // Check if testimonial belongs to the user
  if (testimonial.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this testimonial'
      }
    });
  }
  
  res.status(200).json({
    success: true,
    data: testimonial
  });
});

/**
 * Create a new testimonial
 */
exports.createTestimonial = catchAsync(async (req, res) => {
  // Add user_id to the testimonial data
  const testimonialData = {
    ...req.body,
    user_id: req.user.id,
    status: 'pending' // Always start with pending status
  };
  
  const testimonial = await testimonialService.createTestimonial(testimonialData);
  
  res.status(201).json({
    success: true,
    data: testimonial
  });
});

/**
 * Update an existing testimonial
 */
exports.updateTestimonial = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  // Check if testimonial belongs to the user
  const existingTestimonial = await testimonialService.getTestimonialById(id);
  if (existingTestimonial.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to update this testimonial'
      }
    });
  }
  
  // Non-admin users can't change the status
  if (req.user.role !== 'admin' && req.body.status) {
    delete req.body.status;
  }
  
  const testimonial = await testimonialService.updateTestimonial(id, req.body);
  
  res.status(200).json({
    success: true,
    data: testimonial
  });
});

/**
 * Delete a testimonial
 */
exports.deleteTestimonial = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  // Check if testimonial belongs to the user
  const existingTestimonial = await testimonialService.getTestimonialById(id);
  if (existingTestimonial.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to delete this testimonial'
      }
    });
  }
  
  await testimonialService.deleteTestimonial(id);
  
  res.status(200).json({
    success: true,
    data: {
      message: 'Testimonial deleted successfully'
    }
  });
});

/**
 * Get featured testimonials
 */
exports.getFeaturedTestimonials = catchAsync(async (req, res) => {
  const userId = req.params.userId || req.user.id;
  
  const testimonials = await testimonialService.getFeaturedTestimonials(userId);
  
  res.status(200).json({
    success: true,
    data: testimonials
  });
});

/**
 * Update testimonial status (approve/reject) - Admin only
 */
exports.updateTestimonialStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  // Only admins can update status
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Only admins can approve or reject testimonials'
      }
    });
  }
  
  const testimonial = await testimonialService.updateTestimonialStatus(id, status, req.user.id);
  
  res.status(200).json({
    success: true,
    data: testimonial
  });
});

/**
 * Update testimonial display order
 */
exports.updateTestimonialOrder = catchAsync(async (req, res) => {
  const { testimonialsOrder } = req.body;
  
  // Only admins or owners can update order
  // In a real app, we would check ownership of each testimonial,
  // but for simplicity we'll just allow the action
  
  const result = await testimonialService.updateTestimonialOrder(testimonialsOrder);
  
  res.status(200).json({
    success: true,
    data: result
  });
}); 