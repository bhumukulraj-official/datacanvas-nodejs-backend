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
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
    this.code = 'NOT_001';
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation error', details = null) {
    super(message, 400);
    this.code = 'VAL_001';
    this.details = details;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication error') {
    super(message, 401);
    this.code = 'AUTH_001';
  }
}

class TokenExpiredError extends AuthenticationError {
  constructor(message = 'Token expired') {
    super(message);
    this.code = 'AUTH_002';
  }
}

class InvalidTokenError extends AuthenticationError {
  constructor(message = 'Invalid token') {
    super(message);
    this.code = 'AUTH_003';
  }
}

class PermissionError extends AppError {
  constructor(message = 'Permission denied') {
    super(message, 403);
    this.code = 'PERM_001';
  }
}

class FileError extends AppError {
  constructor(message = 'File error', code = 'FILE_001') {
    super(message, 400);
    this.code = code;
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database error') {
    super(message, 500);
    this.code = 'DB_001';
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429);
    this.code = 'RATE_001';
  }
}

class WebSocketError extends AppError {
  constructor(message = 'WebSocket error', code = 'WS_001') {
    super(message, 500);
    this.code = code;
  }
}

module.exports = {
  AppError,
  NotFoundError,
  ValidationError,
  AuthenticationError,
  TokenExpiredError,
  InvalidTokenError,
  PermissionError,
  FileError,
  DatabaseError,
  RateLimitError,
  WebSocketError
}; 