/**
 * Testimonial Service
 * Handles business logic for testimonial operations
 */
const { Testimonial } = require('../models');
const { NotFoundError, BadRequestError } = require('../../../shared/errors');
const { Op } = require('sequelize');
const sequelize = require('../../../shared/database');

/**
 * Get all testimonials with optional filtering
 */
exports.getAllTestimonials = async (filters = {}, options = {}) => {
  const { userId, status, isFeatured, search } = filters;
  const { limit = 50, offset = 0, order = [['display_order', 'ASC'], ['created_at', 'DESC']] } = options;

  const whereClause = {};
  
  // Add filters if provided
  if (userId) whereClause.user_id = userId;
  if (status) whereClause.status = status;
  if (isFeatured !== undefined) whereClause.is_featured = isFeatured;
  
  // Add search functionality if provided
  if (search) {
    whereClause[Op.or] = [
      { author_name: { [Op.iLike]: `%${search}%` } },
      { author_title: { [Op.iLike]: `%${search}%` } },
      { company: { [Op.iLike]: `%${search}%` } },
      { content: { [Op.iLike]: `%${search}%` } }
    ];
  }

  const testimonials = await Testimonial.findAndCountAll({
    where: whereClause,
    limit,
    offset,
    order
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
exports.updateTestimonialOrder = async (testimonialsOrder = []) => {
  if (!Array.isArray(testimonialsOrder) || testimonialsOrder.length === 0) {
    throw new BadRequestError('Testimonials order data is invalid');
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