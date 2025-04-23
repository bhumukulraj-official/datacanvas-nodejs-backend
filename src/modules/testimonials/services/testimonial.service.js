/**
 * Testimonial Service
 * Handles business logic for testimonial operations
 */
const { Testimonial } = require('../models');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../../../shared/errors');
const { Op } = require('sequelize');
const sequelize = require('../../../shared/database');

/**
 * Get all testimonials with optional filtering
 */
exports.getAllTestimonials = async (filters = {}, options = {}) => {
  const { 
    userId, 
    status, 
    isFeatured, 
    search,
    createdFrom,
    createdTo,
    reviewedFrom,
    reviewedTo
  } = filters;
  
  const { 
    limit = 50, 
    offset = 0, 
    order = [['display_order', 'ASC'], ['created_at', 'DESC']],
    sortBy,
    sortOrder
  } = options;

  const whereClause = {};
  
  // Add filters if provided
  if (userId) whereClause.user_id = userId;
  if (status) whereClause.status = status;
  if (isFeatured !== undefined) whereClause.is_featured = isFeatured;
  
  // Date filters
  if (createdFrom) {
    whereClause.created_at = {
      ...whereClause.created_at,
      [Op.gte]: new Date(createdFrom)
    };
  }
  
  if (createdTo) {
    whereClause.created_at = {
      ...whereClause.created_at,
      [Op.lte]: new Date(createdTo)
    };
  }
  
  if (reviewedFrom) {
    whereClause.reviewed_at = {
      ...whereClause.reviewed_at,
      [Op.gte]: new Date(reviewedFrom)
    };
  }
  
  if (reviewedTo) {
    whereClause.reviewed_at = {
      ...whereClause.reviewed_at,
      [Op.lte]: new Date(reviewedTo)
    };
  }
  
  // Add search functionality if provided
  if (search) {
    whereClause[Op.or] = [
      { author_name: { [Op.iLike]: `%${search}%` } },
      { author_title: { [Op.iLike]: `%${search}%` } },
      { company: { [Op.iLike]: `%${search}%` } },
      { content: { [Op.iLike]: `%${search}%` } }
    ];
  }

  // Handle sorting
  let orderClause = order;
  if (sortBy && sortOrder) {
    orderClause = [[sortBy, sortOrder.toUpperCase()]];
  }

  const testimonials = await Testimonial.findAndCountAll({
    where: whereClause,
    limit,
    offset,
    order: orderClause
  });

  return testimonials;
};

/**
 * Get testimonial by ID
 */
exports.getTestimonialById = async (id) => {
  const testimonial = await Testimonial.findByPk(id);
  
  if (!testimonial) {
    throw new NotFoundError('Testimonial not found');
  }
  
  return testimonial;
};

/**
 * Create a new testimonial
 */
exports.createTestimonial = async (testimonialData) => {
  const testimonial = await Testimonial.create(testimonialData);
  return testimonial;
};

/**
 * Update an existing testimonial
 */
exports.updateTestimonial = async (id, testimonialData) => {
  const testimonial = await Testimonial.findByPk(id);
  
  if (!testimonial) {
    throw new NotFoundError('Testimonial not found');
  }
  
  // Update testimonial
  await testimonial.update(testimonialData);
  
  return testimonial;
};

/**
 * Delete a testimonial (soft delete)
 */
exports.deleteTestimonial = async (id) => {
  const testimonial = await Testimonial.findByPk(id);
  
  if (!testimonial) {
    throw new NotFoundError('Testimonial not found');
  }
  
  await testimonial.destroy();
  return { success: true };
};

/**
 * Get featured testimonials
 */
exports.getFeaturedTestimonials = async (userId) => {
  const testimonials = await Testimonial.findAll({
    where: {
      user_id: userId,
      is_featured: true,
      status: 'approved'
    },
    order: [
      ['display_order', 'ASC'],
      ['created_at', 'DESC']
    ]
  });
  
  return testimonials;
};

/**
 * Update testimonial status (approve/reject)
 */
exports.updateTestimonialStatus = async (id, status, reviewedBy) => {
  const testimonial = await Testimonial.findByPk(id);
  
  if (!testimonial) {
    throw new NotFoundError('Testimonial not found');
  }
  
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    throw new BadRequestError('Invalid status. Must be pending, approved, or rejected');
  }
  
  await testimonial.update({
    status,
    reviewed_by: reviewedBy,
    reviewed_at: new Date()
  });
  
  return testimonial;
};

/**
 * Update testimonial display order
 */
exports.updateTestimonialOrder = async (testimonialsOrder = [], userId) => {
  if (!Array.isArray(testimonialsOrder) || testimonialsOrder.length === 0) {
    throw new BadRequestError('Testimonials order data is invalid');
  }

  // Get all testimonial IDs from the request
  const testimonialIds = testimonialsOrder.map(item => item.id);
  
  // Find all testimonials to verify ownership
  const testimonials = await Testimonial.findAll({
    where: { id: { [Op.in]: testimonialIds } }
  });
  
  // Check if all testimonials exist
  if (testimonials.length !== testimonialIds.length) {
    throw new NotFoundError('One or more testimonials not found');
  }
  
  // Check if user has permission for all testimonials
  const unauthorizedTestimonials = testimonials.filter(
    testimonial => testimonial.user_id !== userId && userId !== 'admin'
  );
  
  if (unauthorizedTestimonials.length > 0) {
    throw new ForbiddenError('You do not have permission to update one or more of these testimonials');
  }

  // Use a transaction to ensure all updates happen atomically
  const result = await sequelize.transaction(async (transaction) => {
    const updatePromises = testimonialsOrder.map(({ id, displayOrder }) => 
      Testimonial.update(
        { display_order: displayOrder },
        { where: { id }, transaction }
      )
    );
    
    await Promise.all(updatePromises);
    return true;
  });

  return { success: result };
};

/**
 * Bulk create testimonials
 */
exports.bulkCreateTestimonials = async (testimonials, userId) => {
  if (!Array.isArray(testimonials) || testimonials.length === 0) {
    throw new BadRequestError('Testimonials data is invalid');
  }
  
  // Add user_id to each testimonial
  const testimonialsWithUserId = testimonials.map(testimonial => ({
    ...testimonial,
    user_id: userId,
    status: 'pending' // Always start with pending status
  }));
  
  // Use a transaction for bulk creation
  const result = await sequelize.transaction(async (transaction) => {
    return await Testimonial.bulkCreate(testimonialsWithUserId, { transaction });
  });
  
  return result;
};

/**
 * Bulk update testimonials
 */
exports.bulkUpdateTestimonials = async (testimonials, userId, isAdmin = false) => {
  if (!Array.isArray(testimonials) || testimonials.length === 0) {
    throw new BadRequestError('Testimonials data is invalid');
  }
  
  // Get all testimonial IDs
  const testimonialIds = testimonials.map(testimonial => testimonial.id);
  
  // Find all testimonials to verify ownership
  const existingTestimonials = await Testimonial.findAll({
    where: { id: { [Op.in]: testimonialIds } }
  });
  
  // Check if all testimonials exist
  if (existingTestimonials.length !== testimonialIds.length) {
    throw new NotFoundError('One or more testimonials not found');
  }
  
  // Map existing testimonials to their IDs for quick lookup
  const testimonialMap = existingTestimonials.reduce((acc, testimonial) => {
    acc[testimonial.id] = testimonial;
    return acc;
  }, {});
  
  // Check if user has permission for all testimonials
  if (!isAdmin) {
    const unauthorizedTestimonials = testimonials.filter(
      testimonial => testimonialMap[testimonial.id].user_id !== userId
    );
    
    if (unauthorizedTestimonials.length > 0) {
      throw new ForbiddenError('You do not have permission to update one or more of these testimonials');
    }
    
    // Non-admin users can't change status
    testimonials = testimonials.map(testimonial => {
      const { status, ...rest } = testimonial;
      return rest;
    });
  }
  
  // Use a transaction for updates
  const result = await sequelize.transaction(async (transaction) => {
    const updatePromises = testimonials.map(testimonial => {
      const { id, ...updateData } = testimonial;
      return Testimonial.update(
        updateData, 
        { where: { id }, returning: true, transaction }
      );
    });
    
    return await Promise.all(updatePromises);
  });
  
  return result;
};

/**
 * Bulk delete testimonials
 */
exports.bulkDeleteTestimonials = async (ids, userId, isAdmin = false) => {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new BadRequestError('Testimonial IDs are invalid');
  }
  
  // Find all testimonials to verify ownership
  const testimonials = await Testimonial.findAll({
    where: { id: { [Op.in]: ids } }
  });
  
  // Check if user has permission for all testimonials
  if (!isAdmin) {
    const unauthorizedTestimonials = testimonials.filter(
      testimonial => testimonial.user_id !== userId
    );
    
    if (unauthorizedTestimonials.length > 0) {
      throw new ForbiddenError('You do not have permission to delete one or more of these testimonials');
    }
  }
  
  // Use a transaction for deletion
  const result = await sequelize.transaction(async (transaction) => {
    return await Testimonial.destroy({
      where: { id: { [Op.in]: ids } },
      transaction
    });
  });
  
  return {
    success: true,
    deletedCount: result,
    requestedCount: ids.length
  };
};

/**
 * Export testimonials
 */
exports.exportTestimonials = async (filters, userId, isAdmin = false) => {
  const whereClause = {};
  
  // If not admin, only show own testimonials
  if (!isAdmin) {
    whereClause.user_id = userId;
  }
  
  // Add filters
  if (filters.status && filters.status !== 'all') {
    whereClause.status = filters.status;
  }
  
  if (filters.featured !== undefined) {
    whereClause.is_featured = filters.featured;
  }
  
  // Find all testimonials
  const testimonials = await Testimonial.findAll({
    where: whereClause,
    order: [
      ['display_order', 'ASC'],
      ['created_at', 'DESC']
    ]
  });
  
  return testimonials;
};

/**
 * Get testimonial statistics
 */
exports.getTestimonialStatistics = async (userId, isAdmin = false, startDate = null, endDate = null) => {
  const whereClause = {};
  
  // If not admin, only show own testimonials
  if (!isAdmin) {
    whereClause.user_id = userId;
  }
  
  // Add date filters if provided
  if (startDate && endDate) {
    whereClause.created_at = {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    };
  } else if (startDate) {
    whereClause.created_at = {
      [Op.gte]: new Date(startDate)
    };
  } else if (endDate) {
    whereClause.created_at = {
      [Op.lte]: new Date(endDate)
    };
  }
  
  // Get total count
  const totalCount = await Testimonial.count({
    where: whereClause
  });
  
  // Get status distribution
  const statusCounts = await Testimonial.findAll({
    attributes: [
      'status',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    where: whereClause,
    group: ['status']
  });
  
  // Get featured count
  const featuredCount = await Testimonial.count({
    where: {
      ...whereClause,
      is_featured: true
    }
  });
  
  // Get ratings distribution
  const ratingDistribution = await Testimonial.findAll({
    attributes: [
      'rating',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    where: {
      ...whereClause,
      rating: { [Op.not]: null }
    },
    group: ['rating'],
    order: [['rating', 'ASC']]
  });
  
  // Calculate average rating
  const ratingAvg = await Testimonial.findOne({
    attributes: [
      [sequelize.fn('AVG', sequelize.col('rating')), 'average']
    ],
    where: {
      ...whereClause,
      rating: { [Op.not]: null }
    }
  });
  
  // Format status counts into an object
  const statusDistribution = {};
  statusCounts.forEach(status => {
    statusDistribution[status.status] = parseInt(status.dataValues.count, 10);
  });
  
  // Format rating distribution
  const ratingCounts = {};
  ratingDistribution.forEach(rating => {
    ratingCounts[rating.rating] = parseInt(rating.dataValues.count, 10);
  });
  
  return {
    totalCount,
    statusDistribution,
    featuredCount,
    ratingDistribution: ratingCounts,
    averageRating: ratingAvg ? parseFloat(ratingAvg.dataValues.average).toFixed(1) : null,
    dateRange: {
      startDate: startDate || null,
      endDate: endDate || null
    }
  };
}; 