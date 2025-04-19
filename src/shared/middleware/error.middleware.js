const { AppError } = require('../errors');
const { AppResponse } = require('../utils/appResponse');

/**
 * Global error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const errorHandler = (err, req, res, next) => {
  // Log error
  console.error('ERROR:', err);

  // Default error
  let statusCode = 500;
  let message = 'Internal server error';
  let errorCode = 'SERVER_ERROR';
  let details = {};

  // Handle known errors
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorCode = err.code;
    details = err.details;
  } else if (err.name === 'SequelizeValidationError') {
    // Handle Sequelize validation errors
    statusCode = 400;
    message = 'Validation Error';
    errorCode = 'VAL_001';
    details = {
      errors: err.errors.map(e => ({
        field: e.path,
        message: e.message,
      })),
    };
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    // Handle Sequelize unique constraint errors
    statusCode = 409;
    message = 'Duplicate Entry';
    errorCode = 'VAL_002';
    details = {
      errors: err.errors.map(e => ({
        field: e.path,
        message: e.message,
      })),
    };
  } else if (err.name === 'JsonWebTokenError') {
    // Handle JWT errors
    statusCode = 401;
    message = 'Invalid token';
    errorCode = 'AUTH_003';
  } else if (err.name === 'TokenExpiredError') {
    // Handle JWT expiration
    statusCode = 401;
    message = 'Token expired';
    errorCode = 'AUTH_002';
  }

  // Send error response
  return AppResponse.error(res, message, statusCode, errorCode, details);
};

module.exports = errorHandler; 