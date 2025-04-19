const logger = require('../utils/logger');
const { AppError } = require('../errors');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log all errors
  logger.error(err.message, {
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  // If it's an operational error, send the defined response
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details || {},
        timestamp: new Date().toISOString()
      }
    });
  }
  
  // For unknown errors, send a generic server error response
  return res.status(500).json({
    success: false,
    error: {
      code: 'SERVER_001',
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    }
  });
};

module.exports = errorHandler; 