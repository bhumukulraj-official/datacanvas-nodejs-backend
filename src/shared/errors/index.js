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
   */
  constructor(message, statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = []) {
    super(message || 'Validation error', 400);
    this.name = 'ValidationError';
    this.details = Array.isArray(details) ? details : [details];
  }
}

class AuthenticationError extends AppError {
  constructor(message) {
    super(message || 'Authentication error', 401);
    this.name = 'AuthenticationError';
  }
}

class ForbiddenError extends AppError {
  constructor(message) {
    super(message || 'Insufficient permissions', 403);
    this.name = 'ForbiddenError';
  }
}

class NotFoundError extends AppError {
  constructor(message) {
    super(message || 'Resource not found', 404);
    this.name = 'NotFoundError';
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message || 'Resource already exists', 409);
    this.name = 'ConflictError';
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

/**
 * Rate Limit Error
 * Thrown when a rate limit is exceeded
 */
class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded', statusCode = 429) {
    super(message, statusCode);
    this.name = 'RateLimitError';
    this.code = 'RATE_001';
  }
}

class WebSocketError extends AppError {
  constructor(message = 'WebSocket error', code = 'WS_001') {
    super(message, 500);
    this.code = code;
  }
}

class TooManyRequestsError extends AppError {
  constructor(message) {
    super(message || 'Too many requests', 429);
  }
}

class ServerError extends AppError {
  constructor(message) {
    super(message || 'Internal server error', 500);
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  TokenExpiredError,
  InvalidTokenError,
  PermissionError,
  FileError,
  DatabaseError,
  RateLimitError,
  WebSocketError,
  TooManyRequestsError,
  ServerError
}; 