/**
 * Testimonial Controller
 * Handles HTTP requests for testimonial-related operations
 */
const { testimonialService } = require('../services');
const { catchAsync } = require('../../../shared/utils');
const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;

/**
 * Get all testimonials with filtering options
 */
exports.getAllTestimonials = catchAsync(async (req, res) => {
  const { 
    status, 
    featured, 
    search, 
    created_from, 
    created_to,
    reviewed_from,
    reviewed_to,
    limit, 
    offset, 
    order,
    sort_by,
    sort_order
  } = req.query;
  
  const filters = {
    userId: req.user.id,
    status: status || null,
    isFeatured: featured === 'true',
    search: search || null,
    createdFrom: created_from || null,
    createdTo: created_to || null,
    reviewedFrom: reviewed_from || null,
    reviewedTo: reviewed_to || null
  };
  
  const options = {
    limit: parseInt(limit, 10) || 50,
    offset: parseInt(offset, 10) || 0,
    order: order ? JSON.parse(order) : undefined,
    sortBy: sort_by,
    sortOrder: sort_order
  };
  
  const { count, rows } = await testimonialService.getAllTestimonials(filters, options);
  
  res.status(200).json({
    success: true,
    data: rows,
    metadata: {
      total: count,
      limit: options.limit,
      offset: options.offset,
      filters: Object.keys(filters)
        .filter(key => filters[key] !== null && filters[key] !== undefined)
        .reduce((obj, key) => {
          obj[key] = filters[key];
          return obj;
        }, {})
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
  
  // Pass the user ID for permission checking
  const result = await testimonialService.updateTestimonialOrder(testimonialsOrder, req.user.id);
  
  res.status(200).json({
    success: true,
    data: result
  });
});

/**
 * Bulk create testimonials
 */
exports.bulkCreateTestimonials = catchAsync(async (req, res) => {
  const { testimonials } = req.body;
  
  const result = await testimonialService.bulkCreateTestimonials(testimonials, req.user.id);
  
  res.status(201).json({
    success: true,
    data: {
      message: `Successfully created ${result.length} testimonials`,
      testimonials: result
    }
  });
});

/**
 * Bulk update testimonials
 */
exports.bulkUpdateTestimonials = catchAsync(async (req, res) => {
  const { testimonials } = req.body;
  const isAdmin = req.user.role === 'admin';
  
  const result = await testimonialService.bulkUpdateTestimonials(testimonials, req.user.id, isAdmin);
  
  res.status(200).json({
    success: true,
    data: {
      message: `Successfully updated ${result.length} testimonials`,
      updates: result
    }
  });
});

/**
 * Bulk delete testimonials
 */
exports.bulkDeleteTestimonials = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const isAdmin = req.user.role === 'admin';
  
  const result = await testimonialService.bulkDeleteTestimonials(ids, req.user.id, isAdmin);
  
  res.status(200).json({
    success: true,
    data: {
      message: `Successfully deleted ${result.deletedCount} testimonials`,
      deletedCount: result.deletedCount,
      requestedCount: result.requestedCount
    }
  });
});

/**
 * Export testimonials
 */
exports.exportTestimonials = catchAsync(async (req, res) => {
  const { format = 'json', status, featured } = req.query;
  const isAdmin = req.user.role === 'admin';
  
  const filters = {
    status,
    featured: featured === 'true' ? true : undefined
  };
  
  const testimonials = await testimonialService.exportTestimonials(filters, req.user.id, isAdmin);
  
  if (format === 'json') {
    return res.status(200).json({
      success: true,
      data: testimonials
    });
  }
  
  if (format === 'csv') {
    const csvStringifier = createCsvStringifier({
      header: [
        { id: 'id', title: 'ID' },
        { id: 'author_name', title: 'Author Name' },
        { id: 'author_title', title: 'Author Title' },
        { id: 'company', title: 'Company' },
        { id: 'content', title: 'Content' },
        { id: 'rating', title: 'Rating' },
        { id: 'status', title: 'Status' },
        { id: 'is_featured', title: 'Featured' },
        { id: 'created_at', title: 'Created At' }
      ]
    });
    
    const csvRecords = testimonials.map(testimonial => ({
      id: testimonial.id,
      author_name: testimonial.author_name,
      author_title: testimonial.author_title || '',
      company: testimonial.company || '',
      content: testimonial.content,
      rating: testimonial.rating || '',
      status: testimonial.status,
      is_featured: testimonial.is_featured ? 'Yes' : 'No',
      created_at: new Date(testimonial.created_at).toISOString().split('T')[0]
    }));
    
    const csvHeader = csvStringifier.getHeaderString();
    const csvBody = csvStringifier.stringifyRecords(csvRecords);
    const csvContent = csvHeader + csvBody;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=testimonials.csv');
    return res.status(200).send(csvContent);
  }
  
  if (format === 'pdf') {
    // In a real implementation, we would use a PDF library to generate the file
    // For now, just return a message about PDF generation
    
    return res.status(200).json({
      success: true,
      message: 'PDF export would be implemented with a PDF library',
      data: {
        testimonialCount: testimonials.length,
        format: 'pdf'
      }
    });
  }
});

/**
 * Get testimonial statistics
 */
exports.getTestimonialStatistics = catchAsync(async (req, res) => {
  const { start_date, end_date } = req.query;
  const isAdmin = req.user.role === 'admin';
  
  const statistics = await testimonialService.getTestimonialStatistics(
    req.user.id,
    isAdmin,
    start_date,
    end_date
  );
  
  res.status(200).json({
    success: true,
    data: statistics
  });
}); 