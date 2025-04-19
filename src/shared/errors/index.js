/**
 * Custom Application Error class
 * @class AppError
 * @extends Error
 */
class AppError extends Error {
  /**
   * Create an AppError
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {string} code - Error code
   * @param {Object} details - Additional error details
   */
  constructor(message, statusCode = 500, code = 'SERVER_ERROR', details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  AppError,
}; 