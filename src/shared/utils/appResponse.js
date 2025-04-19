/**
 * Utility class for standardizing API responses
 */
class AppResponse {
  /**
   * Send a success response
   * @param {Object} res - Express response object
   * @param {*} data - Response data
   * @param {string} message - Success message
   * @param {number} status - HTTP status code
   * @returns {Object} Express response
   */
  static success(res, data = {}, message = 'Operation successful', status = 200) {
    return res.status(status).json({
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send a pagination response
   * @param {Object} res - Express response object
   * @param {*} data - Response data
   * @param {Object} pagination - Pagination metadata
   * @param {string} message - Success message
   * @param {number} status - HTTP status code
   * @returns {Object} Express response
   */
  static pagination(res, data = {}, pagination = {}, message = 'Operation successful', status = 200) {
    return res.status(status).json({
      success: true,
      data,
      pagination,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send an error response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {string} code - Error code
   * @param {Object} details - Additional error details
   * @returns {Object} Express response
   */
  static error(res, message = 'Internal server error', statusCode = 500, code = 'SERVER_ERROR', details = {}) {
    return res.status(statusCode).json({
      success: false,
      error: {
        code,
        message,
        details,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

module.exports = {
  AppResponse,
}; 