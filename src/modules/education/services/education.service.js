/**
 * Education Service
 * Handles business logic for education operations
 */
const { Education } = require('../models');
const { NotFoundError, BadRequestError } = require('../../../shared/errors');
const { Op } = require('sequelize');
const sequelize = require('../../../shared/database');

/**
 * Get all education entries with sorting and pagination
 */
exports.getAllEducation = async (options = {}) => {
  const { userId, limit = 50, offset = 0, sortBy = 'start_date', order = 'DESC' } = options;
  
  const orderMapping = {
    start_date: 'start_date',
    end_date: 'end_date',
    institution: 'institution',
    degree: 'degree'
  };
  
  const sortField = orderMapping[sortBy] || 'start_date';
  
  const education = await Education.findAndCountAll({
    where: {
      user_id: userId
    },
    limit,
    offset,
    order: [[sortField, order]]
  });

  return education;
};

/**
 * Get education by ID
 */
exports.getEducationById = async (id) => {
  const education = await Education.findByPk(id);
  
  if (!education) {
    throw new NotFoundError('Education record not found');
  }
  
  return education;
};

/**
 * Create a new education entry
 */
exports.createEducation = async (educationData) => {
  // Handle is_current flag logic
  if (educationData.is_current === true) {
    educationData.end_date = null;
  }
  
  const education = await Education.create(educationData);
  return education;
};

/**
 * Update an existing education entry
 */
exports.updateEducation = async (id, educationData) => {
  const education = await Education.findByPk(id);
  
  if (!education) {
    throw new NotFoundError('Education record not found');
  }
  
  // Handle is_current flag logic
  if (educationData.is_current === true) {
    educationData.end_date = null;
  }
  
  // Update education
  await education.update(educationData);
  
  return education;
};

/**
 * Delete an education entry (soft delete)
 */
exports.deleteEducation = async (id) => {
  const education = await Education.findByPk(id);
  
  if (!education) {
    throw new NotFoundError('Education record not found');
  }
  
  await education.destroy();
  return { success: true };
};

/**
 * Get current education (where is_current is true)
 */
exports.getCurrentEducation = async (userId) => {
  const education = await Education.findAll({
    where: {
      user_id: userId,
      is_current: true
    },
    order: [['start_date', 'DESC']]
  });
  
  return education;
};

/**
 * Get education history chronologically ordered
 */
exports.getEducationHistory = async (userId) => {
  const education = await Education.findAll({
    where: {
      user_id: userId
    },
    order: [['start_date', 'DESC']]
  });
  
  return education;
};

/**
 * Import education entries for a user (bulk create)
 */
exports.importEducation = async (userId, educationData) => {
  if (!Array.isArray(educationData)) {
    throw new BadRequestError('Education data must be an array');
  }
  
  // Add user_id to each education entry
  const educationWithUserId = educationData.map(education => ({
    ...education,
    user_id: userId
  }));
  
  const education = await Education.bulkCreate(educationWithUserId);
  return education;
}; 