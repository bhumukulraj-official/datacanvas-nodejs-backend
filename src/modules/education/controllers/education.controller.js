/**
 * Education Controller
 * Handles HTTP requests for education-related operations
 */
const { educationService } = require('../services');
const { catchAsync } = require('../../../shared/utils');

/**
 * Get all education entries with sorting and pagination
 */
exports.getAllEducation = catchAsync(async (req, res) => {
  const { limit, offset, sort_by, order } = req.query;
  
  const options = {
    limit: parseInt(limit, 10) || 50,
    offset: parseInt(offset, 10) || 0,
    sortBy: sort_by || 'start_date',
    order: order?.toLowerCase() === 'asc' ? 'ASC' : 'DESC',
    userId: req.user.id
  };
  
  const { count, rows } = await educationService.getAllEducation(options);
  
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
 * Get education by ID
 */
exports.getEducationById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const education = await educationService.getEducationById(id);
  
  // Check if education belongs to the user
  if (education.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this education record'
      }
    });
  }
  
  res.status(200).json({
    success: true,
    data: education
  });
});

/**
 * Create a new education entry
 */
exports.createEducation = catchAsync(async (req, res) => {
  // Add user_id to the education data
  const educationData = {
    ...req.body,
    user_id: req.user.id
  };
  
  // Handle is_current flag affecting end_date
  if (educationData.is_current === true) {
    educationData.end_date = null;
  }
  
  const education = await educationService.createEducation(educationData);
  
  res.status(201).json({
    success: true,
    data: education
  });
});

/**
 * Update an existing education entry
 */
exports.updateEducation = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  // Check if education belongs to the user
  const existingEducation = await educationService.getEducationById(id);
  if (existingEducation.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to update this education record'
      }
    });
  }
  
  const updatedData = { ...req.body };
  
  // Handle is_current flag affecting end_date
  if (updatedData.is_current === true) {
    updatedData.end_date = null;
  }
  
  const education = await educationService.updateEducation(id, updatedData);
  
  res.status(200).json({
    success: true,
    data: education
  });
});

/**
 * Delete an education entry
 */
exports.deleteEducation = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  // Check if education belongs to the user
  const existingEducation = await educationService.getEducationById(id);
  if (existingEducation.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to delete this education record'
      }
    });
  }
  
  await educationService.deleteEducation(id);
  
  res.status(200).json({
    success: true,
    data: {
      message: 'Education record deleted successfully'
    }
  });
});

/**
 * Get current education (where is_current is true)
 */
exports.getCurrentEducation = catchAsync(async (req, res) => {
  const userId = req.params.userId || req.user.id;
  
  const education = await educationService.getCurrentEducation(userId);
  
  res.status(200).json({
    success: true,
    data: education
  });
});

/**
 * Get education history
 */
exports.getEducationHistory = catchAsync(async (req, res) => {
  const userId = req.params.userId || req.user.id;
  
  // If requesting another user's education, check permissions
  if (userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this information'
      }
    });
  }
  
  const education = await educationService.getEducationHistory(userId);
  
  res.status(200).json({
    success: true,
    data: education
  });
});

/**
 * Import education entries (bulk create)
 */
exports.importEducation = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { education } = req.body;
  
  const result = await educationService.importEducation(userId, education);
  
  res.status(201).json({
    success: true,
    data: result
  });
}); 