/**
 * Log controller
 * Handles HTTP requests for log management operations
 */
const logService = require('../services/log.service');
const { catchAsync } = require('../../../shared/utils/errors');

/**
 * Get available log files
 * @route GET /api/v1/admin/system/logs
 */
exports.getLogFiles = catchAsync(async (req, res) => {
  const files = await logService.getLogFiles();
  
  res.status(200).json({
    success: true,
    message: 'Log files retrieved successfully',
    data: {
      files,
      count: files.length
    }
  });
});

/**
 * Get log file content
 * @route GET /api/v1/admin/system/logs/:fileName
 */
exports.getLogContent = catchAsync(async (req, res) => {
  const { fileName } = req.params;
  const { tail, filter, level, startDate, endDate } = req.query;
  
  try {
    const logContent = await logService.getLogContent(fileName, {
      tail: tail ? parseInt(tail) : 100,
      filter,
      level,
      startDate,
      endDate
    });
    
    res.status(200).json({
      success: true,
      message: 'Log content retrieved successfully',
      data: logContent
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get current logging configuration
 * @route GET /api/v1/admin/system/logs/config
 */
exports.getLoggingConfig = catchAsync(async (req, res) => {
  const config = await logService.getLoggingConfig();
  
  res.status(200).json({
    success: true,
    message: 'Logging configuration retrieved successfully',
    data: config
  });
});

/**
 * Set logging level
 * @route POST /api/v1/admin/system/logs/level
 */
exports.setLoggingLevel = catchAsync(async (req, res) => {
  const { level } = req.body;
  
  try {
    const success = await logService.setLoggingLevel(level);
    
    res.status(200).json({
      success: true,
      message: `Logging level set to '${level}' successfully`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Delete a log file
 * @route DELETE /api/v1/admin/system/logs/:fileName
 */
exports.deleteLogFile = catchAsync(async (req, res) => {
  const { fileName } = req.params;
  
  try {
    await logService.deleteLogFile(fileName);
    
    res.status(200).json({
      success: true,
      message: `Log file '${fileName}' deleted successfully`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Archive old log files
 * @route POST /api/v1/admin/system/logs/archive
 */
exports.archiveOldLogs = catchAsync(async (req, res) => {
  const { days } = req.body;
  
  try {
    const result = await logService.archiveOldLogs(days || 30);
    
    res.status(200).json({
      success: true,
      message: `Archived ${result.total} log files successfully`,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}); 