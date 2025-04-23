/**
 * Education Controller
 * Handles HTTP requests for education-related operations
 */
const { educationService } = require('../services');
const { catchAsync } = require('../../../shared/utils');
const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;

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
 * Filter and search education entries
 */
exports.filterEducation = catchAsync(async (req, res) => {
  const { 
    institution, 
    degree,
    field_of_study,
    start_date_from,
    start_date_to,
    end_date_from,
    end_date_to,
    is_current,
    search,
    limit, 
    offset, 
    sort_by, 
    order
  } = req.query;
  
  const filters = {
    userId: req.user.id,
    institution,
    degree,
    field_of_study,
    start_date_from,
    start_date_to,
    end_date_from,
    end_date_to,
    is_current,
    search,
    limit: parseInt(limit, 10) || 50,
    offset: parseInt(offset, 10) || 0,
    sortBy: sort_by || 'start_date',
    order: order?.toLowerCase() === 'asc' ? 'ASC' : 'DESC'
  };
  
  const { count, rows } = await educationService.filterEducation(filters);
  
  res.status(200).json({
    success: true,
    data: rows,
    metadata: {
      total: count,
      limit: filters.limit,
      offset: filters.offset,
      appliedFilters: Object.entries(filters)
        .filter(([key, value]) => 
          value !== undefined && 
          !['userId', 'limit', 'offset', 'sortBy', 'order'].includes(key)
        )
        .reduce((obj, [key, value]) => {
          obj[key] = value;
          return obj;
        }, {})
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

/**
 * Bulk update education entries
 */
exports.bulkUpdateEducation = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { updates } = req.body;
  
  const result = await educationService.bulkUpdateEducation(userId, updates);
  
  res.status(200).json({
    success: true,
    data: {
      message: 'Education records updated successfully',
      updates: result
    }
  });
});

/**
 * Bulk delete education entries
 */
exports.bulkDeleteEducation = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { ids } = req.body;
  
  const result = await educationService.bulkDeleteEducation(userId, ids);
  
  res.status(200).json({
    success: true,
    data: {
      message: 'Education records deleted successfully',
      deletedCount: result.deletedCount,
      totalRequested: result.totalRequested
    }
  });
});

/**
 * Generate education statistics
 */
exports.getEducationStatistics = catchAsync(async (req, res) => {
  const userId = req.params.userId || req.user.id;
  
  // If requesting another user's statistics, check permissions
  if (userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this information'
      }
    });
  }
  
  const statistics = await educationService.getEducationStatistics(userId);
  
  res.status(200).json({
    success: true,
    data: statistics
  });
});

/**
 * Export education data in different formats
 */
exports.exportEducation = catchAsync(async (req, res) => {
  const { format = 'json' } = req.query;
  const userId = req.query.user_id || req.user.id;
  
  // If exporting another user's data, check permissions
  if (userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to export this data'
      }
    });
  }
  
  const data = await educationService.exportEducation(userId, format);
  
  if (format === 'json') {
    return res.status(200).json({
      success: true,
      data
    });
  }
  
  if (format === 'csv') {
    const csvStringifier = createCsvStringifier({
      header: [
        { id: 'id', title: 'ID' },
        { id: 'institution', title: 'Institution' },
        { id: 'degree', title: 'Degree' },
        { id: 'field_of_study', title: 'Field of Study' },
        { id: 'start_date', title: 'Start Date' },
        { id: 'end_date', title: 'End Date' },
        { id: 'is_current', title: 'Current' },
        { id: 'grade', title: 'Grade' },
        { id: 'location', title: 'Location' },
        { id: 'activities', title: 'Activities' },
        { id: 'description', title: 'Description' }
      ]
    });
    
    const csvHeader = csvStringifier.getHeaderString();
    const csvBody = csvStringifier.stringifyRecords(data);
    const csvContent = csvHeader + csvBody;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=education_export.csv');
    return res.status(200).send(csvContent);
  }
  
  if (format === 'pdf') {
    // For PDF, we'll just return the data with a custom header
    // In a real implementation, you would use a PDF library to generate the file
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('X-PDF-Generation', 'Required');
    return res.status(200).json({
      success: true,
      data,
      format: 'pdf',
      message: 'PDF generation would be implemented with a PDF library in production'
    });
  }
}); 