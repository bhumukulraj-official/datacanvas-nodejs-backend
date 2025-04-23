/**
 * Experience Controller
 * Handles HTTP requests for experience-related operations
 */
const { experienceService } = require('../services');
const { catchAsync } = require('../../../shared/utils');
const { clearCacheByPattern } = require('../../../shared/cache');
const { BadRequestError } = require('../../../shared/errors');

/**
 * Get all experiences with sorting, filtering, and pagination
 */
exports.getAllExperiences = catchAsync(async (req, res) => {
  const { 
    limit, 
    offset, 
    sort_by, 
    order,
    search,
    technology,
    company,
    startDateFrom,
    startDateTo,
    endDateFrom,
    endDateTo,
    isCurrentOnly
  } = req.query;
  
  const options = {
    limit: parseInt(limit, 10) || 50,
    offset: parseInt(offset, 10) || 0,
    sortBy: sort_by || 'start_date',
    order: order?.toLowerCase() === 'asc' ? 'ASC' : 'DESC',
    userId: req.user.id,
    search,
    technology,
    company,
    startDateFrom,
    startDateTo,
    endDateFrom,
    endDateTo,
    isCurrentOnly
  };
  
  const { count, rows } = await experienceService.getAllExperiences(options);
  
  res.status(200).json({
    success: true,
    data: rows,
    metadata: {
      total: count,
      limit: options.limit,
      offset: options.offset,
      filters: {
        search,
        technology,
        company,
        startDateFrom,
        startDateTo,
        endDateFrom,
        endDateTo,
        isCurrentOnly
      }
    }
  });
});

/**
 * Get experience by ID
 */
exports.getExperienceById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const experience = await experienceService.getExperienceById(id);
  
  // Check if experience belongs to the user
  if (experience.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this experience'
      }
    });
  }
  
  res.status(200).json({
    success: true,
    data: experience
  });
});

/**
 * Create a new experience
 */
exports.createExperience = catchAsync(async (req, res) => {
  // Add user_id to the experience data
  const experienceData = {
    ...req.body,
    user_id: req.user.id
  };
  
  const experience = await experienceService.createExperience(experienceData);
  
  // Clear cache for this user's experience data
  await clearCacheByPattern(`experience:*:${req.user.id}`);
  
  res.status(201).json({
    success: true,
    data: experience
  });
});

/**
 * Update an existing experience
 */
exports.updateExperience = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  // Check if experience belongs to the user
  const existingExperience = await experienceService.getExperienceById(id);
  if (existingExperience.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to update this experience'
      }
    });
  }
  
  const experience = await experienceService.updateExperience(id, req.body);
  
  // Clear cache for this user's experience data
  await clearCacheByPattern(`experience:*:${existingExperience.user_id}`);
  
  res.status(200).json({
    success: true,
    data: experience
  });
});

/**
 * Delete an experience
 */
exports.deleteExperience = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  // Check if experience belongs to the user
  const existingExperience = await experienceService.getExperienceById(id);
  if (existingExperience.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to delete this experience'
      }
    });
  }
  
  await experienceService.deleteExperience(id);
  
  // Clear cache for this user's experience data
  await clearCacheByPattern(`experience:*:${existingExperience.user_id}`);
  
  res.status(200).json({
    success: true,
    data: {
      message: 'Experience deleted successfully'
    }
  });
});

/**
 * Get current experiences (where end_date is null)
 */
exports.getCurrentExperiences = catchAsync(async (req, res) => {
  const userId = req.params.userId || req.user.id;
  
  const experiences = await experienceService.getCurrentExperiences(userId);
  
  res.status(200).json({
    success: true,
    data: experiences
  });
});

/**
 * Get work history
 */
exports.getWorkHistory = catchAsync(async (req, res) => {
  const userId = req.params.userId || req.user.id;
  
  // If requesting another user's experience, check permissions
  if (userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this information'
      }
    });
  }
  
  const experiences = await experienceService.getWorkHistory(userId);
  
  res.status(200).json({
    success: true,
    data: experiences
  });
});

/**
 * Import experiences (bulk create)
 */
exports.importExperiences = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { experiences } = req.body;
  
  const result = await experienceService.importExperiences(userId, experiences);
  
  // Clear cache for this user's experience data
  await clearCacheByPattern(`experience:*:${userId}`);
  
  res.status(201).json({
    success: true,
    data: result
  });
});

/**
 * Get public experiences for a user
 * This endpoint is public (no auth required)
 */
exports.getPublicExperiences = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { limit, offset } = req.query;
  
  const options = {
    limit: parseInt(limit, 10) || 50,
    offset: parseInt(offset, 10) || 0
  };
  
  const { count, rows } = await experienceService.getPublicExperiences(userId, options);
  
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
 * Get experience statistics
 */
exports.getExperienceStatistics = catchAsync(async (req, res) => {
  const userId = req.user.id;
  
  const statistics = await experienceService.getExperienceStatistics(userId);
  
  res.status(200).json({
    success: true,
    data: statistics
  });
});

/**
 * Export experiences
 */
exports.exportExperiences = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { format } = req.query;
  
  const result = await experienceService.exportExperiences(userId, format);
  
  // Handle different export formats
  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="experiences_export.csv"');
    return res.status(200).send(result);
  }
  
  // Default to JSON
  res.status(200).json({
    success: true,
    data: result
  });
});

/**
 * Get experiences by technology
 */
exports.getExperiencesByTechnology = catchAsync(async (req, res) => {
  const { technology } = req.params;
  const { limit, offset } = req.query;
  
  const options = {
    limit: parseInt(limit, 10) || 50,
    offset: parseInt(offset, 10) || 0,
    userId: req.user.id,
    technology
  };
  
  const { count, rows } = await experienceService.getExperiencesByTechnology(options);
  
  res.status(200).json({
    success: true,
    data: rows,
    metadata: {
      total: count,
      limit: options.limit,
      offset: options.offset,
      technology
    }
  });
});

/**
 * Get public experiences by technology
 * This endpoint is public (no auth required)
 */
exports.getPublicExperiencesByTechnology = catchAsync(async (req, res) => {
  const { technology } = req.params;
  const { limit, offset } = req.query;
  
  const options = {
    limit: parseInt(limit, 10) || 50,
    offset: parseInt(offset, 10) || 0,
    technology
  };
  
  const { count, rows } = await experienceService.getPublicExperiencesByTechnology(options);
  
  res.status(200).json({
    success: true,
    data: rows,
    metadata: {
      total: count,
      limit: options.limit,
      offset: options.offset,
      technology
    }
  });
});

/**
 * Get technology distribution
 */
exports.getTechnologyDistribution = catchAsync(async (req, res) => {
  const userId = req.user.id;
  
  const distribution = await experienceService.getTechnologyDistribution(userId);
  
  res.status(200).json({
    success: true,
    data: distribution
  });
});

/**
 * Get career timeline
 */
exports.getCareerTimeline = catchAsync(async (req, res) => {
  const userId = req.user.id;
  
  const timeline = await experienceService.getCareerTimeline(userId);
  
  res.status(200).json({
    success: true,
    data: timeline
  });
});

/**
 * Bulk update experiences
 */
exports.bulkUpdateExperiences = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { experiences } = req.body;
  
  if (!Array.isArray(experiences) || experiences.length === 0) {
    throw new BadRequestError('Invalid experiences data');
  }
  
  const result = await experienceService.bulkUpdateExperiences(userId, experiences);
  
  // Clear cache
  await clearCacheByPattern('experience:*');
  
  res.status(200).json({
    success: true,
    data: {
      updated: result.length,
      experiences: result
    }
  });
});

/**
 * Bulk delete experiences
 */
exports.bulkDeleteExperiences = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { ids } = req.body;
  
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new BadRequestError('Invalid IDs provided');
  }
  
  const result = await experienceService.bulkDeleteExperiences(userId, ids);
  
  // Clear cache
  await clearCacheByPattern('experience:*');
  
  res.status(200).json({
    success: true,
    data: {
      deleted: result.count,
      ids: result.ids
    }
  });
}); 