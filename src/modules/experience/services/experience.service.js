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

/**
 * Get public experiences for a user
 * @param {number} userId - The user ID whose experiences to retrieve
 * @param {Object} options - Additional options (limit, offset, etc.)
 */
exports.getPublicExperiences = async (userId, options = {}) => {
  const { limit = 50, offset = 0 } = options;
  
  const experiences = await Experience.findAndCountAll({
    where: {
      user_id: userId
    },
    attributes: [
      'id', 'title', 'company', 'start_date', 'end_date', 
      'description', 'technologies'
    ],
    limit,
    offset,
    order: [['start_date', 'DESC']]
  });
  
  // Enhance experiences with calculated duration
  experiences.rows = experiences.rows.map(exp => {
    const enhancedExp = exp.toJSON ? exp.toJSON() : { ...exp };
    enhancedExp.duration = calculateExperienceDuration(exp.start_date, exp.end_date);
    enhancedExp.is_current = !exp.end_date;
    return enhancedExp;
  });
  
  return experiences;
};

/**
 * Calculate experience statistics for a user
 * @param {number} userId - The user ID
 */
exports.getExperienceStatistics = async (userId) => {
  // Get all experiences for the user
  const experiences = await Experience.findAll({
    where: {
      user_id: userId
    },
    attributes: [
      'id', 'company', 'start_date', 'end_date', 'technologies'
    ],
    order: [['start_date', 'ASC']]
  });
  
  // Initialize statistics
  const stats = {
    totalExperiences: experiences.length,
    totalCompanies: new Set(experiences.map(exp => exp.company)).size,
    totalYearsOfExperience: 0,
    currentlyEmployed: experiences.some(exp => !exp.end_date),
    technologiesUsed: new Set(),
    longestTenure: {
      company: null,
      years: 0
    },
    averageTenure: 0,
    mostRecentCompany: null,
    earliestExperience: null,
    latestExperience: null
  };
  
  // Calculate total experience, accounting for overlapping periods
  let totalDays = 0;
  let longestTenureDays = 0;
  let tenureSum = 0;
  
  experiences.forEach(exp => {
    // Add technologies
    if (Array.isArray(exp.technologies)) {
      exp.technologies.forEach(tech => stats.technologiesUsed.add(tech));
    }
    
    // Calculate duration
    const startDate = new Date(exp.start_date);
    const endDate = exp.end_date ? new Date(exp.end_date) : new Date();
    const durationDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
    
    // Add to total
    totalDays += durationDays;
    tenureSum += durationDays;
    
    // Check if this is the longest tenure
    if (durationDays > longestTenureDays) {
      longestTenureDays = durationDays;
      stats.longestTenure = {
        company: exp.company,
        years: parseFloat((durationDays / 365.25).toFixed(1))
      };
    }
    
    // Track earliest and latest experiences
    if (!stats.earliestExperience || startDate < new Date(stats.earliestExperience.start_date)) {
      stats.earliestExperience = {
        company: exp.company,
        start_date: exp.start_date
      };
    }
    
    if (!stats.latestExperience || 
        (exp.end_date && new Date(exp.end_date) > new Date(stats.latestExperience.end_date || '1970-01-01'))) {
      stats.latestExperience = {
        company: exp.company,
        end_date: exp.end_date
      };
    }
    
    // Track most recent company
    if (!exp.end_date) {
      stats.mostRecentCompany = exp.company;
    }
  });
  
  // Calculate years and averages
  stats.totalYearsOfExperience = parseFloat((totalDays / 365.25).toFixed(1));
  stats.averageTenure = experiences.length > 0 
    ? parseFloat(((tenureSum / experiences.length) / 365.25).toFixed(1)) 
    : 0;
  
  // Convert set to array for technologies
  stats.technologiesUsed = Array.from(stats.technologiesUsed);
  
  return stats;
};

/**
 * Calculate duration between two dates in a human-readable format
 * @param {string|Date} startDate - Start date
 * @param {string|Date|null} endDate - End date or null for current positions
 * @returns {Object} Duration object with years and months
 */
function calculateExperienceDuration(startDate, endDate) {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  
  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  // Format as string
  let duration = '';
  if (years > 0) {
    duration += `${years} year${years !== 1 ? 's' : ''}`;
  }
  if (months > 0 || years === 0) {
    if (years > 0) duration += ' ';
    duration += `${months} month${months !== 1 ? 's' : ''}`;
  }
  
  return {
    years,
    months,
    formatted: duration
  };
}

/**
 * Export experiences in various formats
 * @param {number} userId - The user ID
 * @param {string} format - Export format (json or csv)
 */
exports.exportExperiences = async (userId, format = 'json') => {
  const experiences = await Experience.findAll({
    where: {
      user_id: userId
    },
    order: [
      ['start_date', 'DESC']
    ],
    raw: true
  });
  
  // Enhance with duration
  const enhancedExperiences = experiences.map(exp => {
    const duration = calculateExperienceDuration(exp.start_date, exp.end_date);
    return {
      ...exp,
      duration: duration.formatted,
      is_current: !exp.end_date
    };
  });
  
  if (format === 'csv') {
    // Convert to CSV format
    if (enhancedExperiences.length === 0) {
      return 'No experiences found';
    }
    
    const headers = Object.keys(enhancedExperiences[0])
      .filter(key => !['deleted_at', 'user_id'].includes(key))
      .join(',');
      
    const rows = enhancedExperiences.map(exp => 
      Object.entries(exp)
        .filter(([key]) => !['deleted_at', 'user_id'].includes(key))
        .map(([_, value]) => {
          if (value === null) return '';
          if (Array.isArray(value)) return `"${value.join(', ')}"`;
          if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
          return value;
        })
        .join(',')
    ).join('\n');
    
    return `${headers}\n${rows}`;
  }
  
  // Default to JSON format
  return enhancedExperiences;
}; 