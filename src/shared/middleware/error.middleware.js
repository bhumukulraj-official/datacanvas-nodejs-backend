const logger = require('../utils/logger');
const { AppError } = require('../errors');

/**
 * Global error handler middleware
 * Handles all errors in the application
 * Distinguishes between operational errors (expected) and programming errors (unexpected)
 */
const errorHandler = (err, req, res, next) => {
  // Add request context to the error log
  const errorContext = {
    requestId: req.id || 'unknown',
    path: req.originalUrl || req.url,
    method: req.method,
    ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    userId: req.user ? req.user.id : 'unauthenticated',
    timestamp: new Date().toISOString()
  };

  // Handle operational errors (expected errors)
  if (err instanceof AppError) {
    // Operational errors are expected and should be handled accordingly
    // Log with appropriate level based on status code
    if (err.statusCode >= 500) {
      logger.error(`[${err.code}] ${err.message}`, {
        ...errorContext,
        stack: err.stack,
        details: err.details
      });
    } else if (err.statusCode >= 400) {
      logger.warn(`[${err.code}] ${err.message}`, {
        ...errorContext,
        details: err.details
      });
    } else {
      logger.info(`[${err.code}] ${err.message}`, {
        ...errorContext,
        details: err.details
      });
    }

    // Send standardized error response
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
  
  // Handle programming errors (unexpected errors)
  // These are bugs that should be fixed
  logger.error('Unhandled exception', {
    ...errorContext,
    error: err.message,
    name: err.name,
    stack: err.stack
  });

  // If we're in production, don't expose error details to the client
  const isDev = process.env.NODE_ENV === 'development';
  
  // For unknown errors, send a generic server error response
  return res.status(500).json({
    success: false,
    error: {
      code: 'SERVER_001',
      message: 'Internal server error',
      // Only include stack trace in development
      ...(isDev && { stack: err.stack }),
      timestamp: new Date().toISOString()
    }
  });
};

module.exports = errorHandler; 