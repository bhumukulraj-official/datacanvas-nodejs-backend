/**
 * Experience Controller
 * Handles HTTP requests for experience-related operations
 */
const { experienceService } = require('../services');
const { catchAsync } = require('../../../shared/utils');

/**
 * Get all experiences with sorting and pagination
 */
exports.getAllExperiences = catchAsync(async (req, res) => {
  const { limit, offset, sort_by, order } = req.query;
  
  const options = {
    limit: parseInt(limit, 10) || 50,
    offset: parseInt(offset, 10) || 0,
    sortBy: sort_by || 'start_date',
    order: order?.toLowerCase() === 'asc' ? 'ASC' : 'DESC',
    userId: req.user.id
  };
  
  const { count, rows } = await experienceService.getAllExperiences(options);
  
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
  
  res.status(201).json({
    success: true,
    data: result
  });
}); 