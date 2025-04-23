/**
 * Experience Service
 * Handles business logic for experience operations
 */
const { Experience } = require('../models');
const { NotFoundError, BadRequestError } = require('../../../shared/errors');
const { Op } = require('sequelize');
const sequelize = require('../../../shared/database');

/**
 * Get all experiences with sorting and pagination
 */
exports.getAllExperiences = async (options = {}) => {
  const { userId, limit = 50, offset = 0, sortBy = 'start_date', order = 'DESC' } = options;
  
  const orderMapping = {
    start_date: 'start_date',
    end_date: 'end_date',
    company: 'company'
  };
  
  const sortField = orderMapping[sortBy] || 'start_date';
  
  const experiences = await Experience.findAndCountAll({
    where: {
      user_id: userId
    },
    limit,
    offset,
    order: [[sortField, order]]
  });

  return experiences;
};

/**
 * Get experience by ID
 */
exports.getExperienceById = async (id) => {
  const experience = await Experience.findByPk(id);
  
  if (!experience) {
    throw new NotFoundError('Experience not found');
  }
  
  return experience;
};

/**
 * Create a new experience
 */
exports.createExperience = async (experienceData) => {
  const experience = await Experience.create(experienceData);
  return experience;
};

/**
 * Update an existing experience
 */
exports.updateExperience = async (id, experienceData) => {
  const experience = await Experience.findByPk(id);
  
  if (!experience) {
    throw new NotFoundError('Experience not found');
  }
  
  // Update experience
  await experience.update(experienceData);
  
  return experience;
};

/**
 * Delete an experience (soft delete)
 */
exports.deleteExperience = async (id) => {
  const experience = await Experience.findByPk(id);
  
  if (!experience) {
    throw new NotFoundError('Experience not found');
  }
  
  await experience.destroy();
  return { success: true };
};

/**
 * Get current experiences (where end_date is null)
 */
exports.getCurrentExperiences = async (userId) => {
  const experiences = await Experience.findAll({
    where: {
      user_id: userId,
      end_date: null
    },
    order: [['start_date', 'DESC']]
  });
  
  return experiences;
};

/**
 * Get user's work history (chronologically ordered)
 */
exports.getWorkHistory = async (userId) => {
  const experiences = await Experience.findAll({
    where: {
      user_id: userId
    },
    order: [
      ['start_date', 'DESC']
    ]
  });
  
  return experiences;
};

/**
 * Import experiences for a user (bulk create)
 */
exports.importExperiences = async (userId, experiencesData) => {
  if (!Array.isArray(experiencesData)) {
    throw new BadRequestError('Experiences data must be an array');
  }
  
  // Add user_id to each experience
  const experiencesWithUserId = experiencesData.map(experience => ({
    ...experience,
    user_id: userId
  }));
  
  const experiences = await Experience.bulkCreate(experiencesWithUserId);
  return experiences;
}; 