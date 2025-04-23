/**
 * Experience Service
 * Handles business logic for experience operations
 */
const { Experience } = require('../models');
const { NotFoundError, BadRequestError } = require('../../../shared/errors');
const { Op } = require('sequelize');
const sequelize = require('../../../shared/database');
const { redisClient } = require('../../../shared/cache');
const logger = require('../../../shared/utils/logger');

/**
 * Get all experiences with advanced filtering, sorting and pagination
 */
exports.getAllExperiences = async (options = {}) => {
  const { 
    userId, 
    limit = 50, 
    offset = 0, 
    sortBy = 'start_date', 
    order = 'DESC',
    search = null,
    technology = null,
    startDateFrom = null,
    startDateTo = null,
    endDateFrom = null,
    endDateTo = null,
    company = null,
    isCurrentOnly = false
  } = options;
  
  const orderMapping = {
    start_date: 'start_date',
    end_date: 'end_date',
    company: 'company',
    title: 'title',
    created_at: 'created_at',
    updated_at: 'updated_at'
  };
  
  const sortField = orderMapping[sortBy] || 'start_date';
  
  // Build where clause
  const whereClause = { user_id: userId };
  
  // Search in title, company, and description
  if (search) {
    whereClause[Op.or] = [
      { title: { [Op.iLike]: `%${search}%` } },
      { company: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } }
    ];
  }
  
  // Filter by specific company
  if (company) {
    whereClause.company = { [Op.iLike]: `%${company}%` };
  }
  
  // Filter by technology
  if (technology) {
    whereClause.technologies = { [Op.contains]: [technology] };
  }
  
  // Date range filters
  if (startDateFrom) {
    whereClause.start_date = { ...(whereClause.start_date || {}), [Op.gte]: startDateFrom };
  }
  
  if (startDateTo) {
    whereClause.start_date = { ...(whereClause.start_date || {}), [Op.lte]: startDateTo };
  }
  
  if (endDateFrom) {
    whereClause.end_date = { ...(whereClause.end_date || {}), [Op.gte]: endDateFrom };
  }
  
  if (endDateTo) {
    whereClause.end_date = { ...(whereClause.end_date || {}), [Op.lte]: endDateTo };
  }
  
  // Only current experiences (where end_date is null)
  if (isCurrentOnly) {
    whereClause.end_date = null;
  }
  
  const experiences = await Experience.findAndCountAll({
    where: whereClause,
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
  // Try to get from cache first
  const cacheKey = `experience:statistics:${userId}`;
  try {
    const cachedStats = await redisClient.get(cacheKey);
    if (cachedStats) {
      return JSON.parse(cachedStats);
    }
  } catch (error) {
    // Continue with calculation on cache error
    logger.error('Error getting experience statistics from cache', error);
  }

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
  
  // Convert Set to Array for JSON serialization
  stats.technologiesUsed = Array.from(stats.technologiesUsed);
  
  // Calculate total years of experience
  stats.totalYearsOfExperience = parseFloat((totalDays / 365.25).toFixed(1));
  
  // Calculate average tenure
  stats.averageTenure = experiences.length 
    ? parseFloat((tenureSum / experiences.length / 365.25).toFixed(1)) 
    : 0;
  
  // Add skill distribution (technology frequency)
  const techCount = {};
  experiences.forEach(exp => {
    if (Array.isArray(exp.technologies)) {
      exp.technologies.forEach(tech => {
        techCount[tech] = (techCount[tech] || 0) + 1;
      });
    }
  });
  
  // Convert to sorted array
  stats.technologyDistribution = Object.entries(techCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  
  // Cache the result
  try {
    // Cache for 1 hour (3600 seconds)
    await redisClient.setex(cacheKey, 3600, JSON.stringify(stats));
  } catch (error) {
    // Log error but don't fail the request
    logger.error('Error caching experience statistics', error);
  }
  
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

/**
 * Get experiences by technology
 */
exports.getExperiencesByTechnology = async (options = {}) => {
  const { userId, technology, limit = 50, offset = 0 } = options;
  
  const experiences = await Experience.findAndCountAll({
    where: {
      user_id: userId,
      technologies: {
        [Op.contains]: [technology]
      }
    },
    limit,
    offset,
    order: [['start_date', 'DESC']]
  });
  
  return experiences;
};

/**
 * Get public experiences by technology
 */
exports.getPublicExperiencesByTechnology = async (options = {}) => {
  const { technology, limit = 50, offset = 0 } = options;
  
  const experiences = await Experience.findAndCountAll({
    where: {
      technologies: {
        [Op.contains]: [technology]
      }
    },
    attributes: [
      'id', 'user_id', 'title', 'company', 'start_date', 'end_date', 
      'description', 'technologies'
    ],
    limit,
    offset,
    order: [['start_date', 'DESC']]
  });
  
  // Enhance experiences with calculated duration and is_current flag
  experiences.rows = experiences.rows.map(exp => {
    const enhancedExp = exp.toJSON ? exp.toJSON() : { ...exp };
    enhancedExp.duration = calculateExperienceDuration(exp.start_date, exp.end_date);
    enhancedExp.is_current = !exp.end_date;
    return enhancedExp;
  });
  
  return experiences;
};

/**
 * Get technology distribution for a user
 */
exports.getTechnologyDistribution = async (userId) => {
  // Get all experiences for the user
  const experiences = await Experience.findAll({
    where: {
      user_id: userId
    },
    attributes: ['technologies', 'start_date', 'end_date']
  });
  
  // Count technology occurrences
  const techDistribution = {};
  const techYearsExperience = {};
  
  experiences.forEach(exp => {
    if (!Array.isArray(exp.technologies)) return;
    
    // Calculate duration for this experience
    const startDate = new Date(exp.start_date);
    const endDate = exp.end_date ? new Date(exp.end_date) : new Date();
    const durationYears = (endDate - startDate) / (1000 * 60 * 60 * 24 * 365.25);
    
    exp.technologies.forEach(tech => {
      // Count occurrences
      techDistribution[tech] = (techDistribution[tech] || 0) + 1;
      
      // Sum years of experience with each technology
      techYearsExperience[tech] = (techYearsExperience[tech] || 0) + durationYears;
    });
  });
  
  // Format result as array of objects
  const result = Object.keys(techDistribution).map(tech => ({
    technology: tech,
    count: techDistribution[tech],
    yearsExperience: parseFloat(techYearsExperience[tech].toFixed(1))
  }));
  
  // Sort by count (descending)
  result.sort((a, b) => b.count - a.count);
  
  return result;
};

/**
 * Get career timeline data
 */
exports.getCareerTimeline = async (userId) => {
  // Get all experiences for the user
  const experiences = await Experience.findAll({
    where: {
      user_id: userId
    },
    order: [['start_date', 'ASC']]
  });
  
  // Transform experiences for timeline visualization
  const timeline = experiences.map(exp => {
    const formattedExp = {
      id: exp.id,
      title: exp.title,
      company: exp.company,
      startDate: exp.start_date,
      endDate: exp.end_date || 'Present',
      duration: calculateExperienceDuration(exp.start_date, exp.end_date),
      isCurrent: !exp.end_date,
      technologies: exp.technologies || []
    };
    
    return formattedExp;
  });
  
  // Add timeline metadata
  const timelineData = {
    items: timeline,
    metadata: {
      startDate: timeline.length > 0 ? timeline[0].startDate : null,
      endDate: timeline.length > 0 ? 
        (timeline[timeline.length - 1].endDate === 'Present' ? 
          new Date().toISOString().split('T')[0] : 
          timeline[timeline.length - 1].endDate) : 
        null,
      totalItems: timeline.length
    }
  };
  
  return timelineData;
};

/**
 * Bulk update experiences
 */
exports.bulkUpdateExperiences = async (userId, experiences) => {
  if (!Array.isArray(experiences) || experiences.length === 0) {
    throw new BadRequestError('Experiences must be a non-empty array');
  }
  
  // Get all experience IDs to update
  const ids = experiences.map(exp => exp.id);
  
  // Verify all experiences belong to the user
  const existingExperiences = await Experience.findAll({
    where: {
      id: { [Op.in]: ids }
    },
    attributes: ['id', 'user_id']
  });
  
  // Check ownership of all experiences
  const unauthorized = existingExperiences.filter(exp => exp.user_id !== userId);
  if (unauthorized.length > 0) {
    throw new BadRequestError('You do not have permission to update some of these experiences');
  }
  
  // Check if all experiences exist
  if (existingExperiences.length !== ids.length) {
    throw new BadRequestError('Some experience IDs do not exist');
  }
  
  // Update each experience
  const updatedExperiences = [];
  for (const expData of experiences) {
    const { id, ...updateData } = expData;
    const experience = await Experience.findByPk(id);
    await experience.update(updateData);
    updatedExperiences.push(experience);
  }
  
  return updatedExperiences;
};

/**
 * Bulk delete experiences
 */
exports.bulkDeleteExperiences = async (userId, ids) => {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new BadRequestError('IDs must be a non-empty array');
  }
  
  // Verify all experiences belong to the user
  const existingExperiences = await Experience.findAll({
    where: {
      id: { [Op.in]: ids }
    },
    attributes: ['id', 'user_id']
  });
  
  // Check ownership of all experiences
  const unauthorized = existingExperiences.filter(exp => exp.user_id !== userId);
  if (unauthorized.length > 0) {
    throw new BadRequestError('You do not have permission to delete some of these experiences');
  }
  
  // Perform bulk delete
  const deleted = await Experience.destroy({
    where: {
      id: { [Op.in]: ids },
      user_id: userId
    }
  });
  
  return {
    count: deleted,
    ids: existingExperiences.map(exp => exp.id)
  };
}; 