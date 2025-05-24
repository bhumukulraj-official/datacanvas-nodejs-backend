/**
 * Base application error class
 */
class AppError extends Error {
  constructor(message, statusCode, errorCode, data = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode || 500;
    this.errorCode = errorCode || 'SERVER_ERROR';
    this.data = data;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: {
        name: this.name,
        message: this.message,
        statusCode: this.statusCode,
        errorCode: this.errorCode,
        timestamp: this.timestamp,
        ...(Object.keys(this.data).length > 0 && { data: this.data }),
      }
    };
  }
}

/**
 * HTTP Errors
 */

class BadRequestError extends AppError {
  constructor(message = 'Bad Request', errorCode = 'BAD_REQUEST', data = {}) {
    super(message, 400, errorCode, data);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', errorCode = 'UNAUTHORIZED', data = {}) {
    super(message, 401, errorCode, data);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', errorCode = 'FORBIDDEN', data = {}) {
    super(message, 403, errorCode, data);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource Not Found', errorCode = 'NOT_FOUND', data = {}) {
    super(message, 404, errorCode, data);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource Conflict', errorCode = 'CONFLICT', data = {}) {
    super(message, 409, errorCode, data);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation Error', errorCode = 'VALIDATION_ERROR', data = {}) {
    super(message, 422, errorCode, data);
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too Many Requests', errorCode = 'RATE_LIMIT', data = {}) {
    super(message, 429, errorCode, data);
  }
}

class ServerError extends AppError {
  constructor(message = 'Internal Server Error', errorCode = 'SERVER_ERROR', data = {}) {
    super(message, 500, errorCode, data);
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database Error', errorCode = 'DATABASE_ERROR', data = {}) {
    super(message, 500, errorCode, data);
  }
}

class ServiceUnavailableError extends AppError {
  constructor(message = 'Service Unavailable', errorCode = 'SERVICE_UNAVAILABLE', data = {}) {
    super(message, 503, errorCode, data);
  }
}

/**
 * Authentication/Authorization Errors
 */

class AuthenticationError extends UnauthorizedError {
  constructor(message = 'Authentication Failed', errorCode = 'AUTH_FAILED', data = {}) {
    super(message, errorCode, data);
  }
}

class TokenExpiredError extends UnauthorizedError {
  constructor(message = 'Token Expired', errorCode = 'TOKEN_EXPIRED', data = {}) {
    super(message, errorCode, data);
  }
}

class InvalidTokenError extends UnauthorizedError {
  constructor(message = 'Invalid Token', errorCode = 'INVALID_TOKEN', data = {}) {
    super(message, errorCode, data);
  }
}

class InvalidCredentialsError extends UnauthorizedError {
  constructor(message = 'Invalid Credentials', errorCode = 'INVALID_CREDENTIALS', data = {}) {
    super(message, errorCode, data);
  }
}

/**
 * Resource Errors
 */

class ResourceNotFoundError extends NotFoundError {
  constructor(resourceType, id, message = null) {
    const errorMessage = message || `${resourceType} with ID ${id} not found`;
    super(errorMessage, 'RESOURCE_NOT_FOUND', { resourceType, id });
  }
}

class DuplicateResourceError extends ConflictError {
  constructor(resourceType, field, value, message = null) {
    const errorMessage = message || `${resourceType} with ${field} ${value} already exists`;
    super(errorMessage, 'DUPLICATE_RESOURCE', { resourceType, field, value });
  }
}

/**
 * Error helper functions
 */

/**
 * Convert Sequelize errors to app errors
 * @param {Error} error - The Sequelize error
 * @returns {AppError} Mapped app error
 */
const handleSequelizeError = (error) => {
  if (error.name === 'SequelizeValidationError') {
    const validationErrors = error.errors.map(err => ({
      field: err.path,
      message: err.message,
      value: err.value
    }));
    
    return new ValidationError(
      'Validation failed',
      'SEQUELIZE_VALIDATION_ERROR',
      { errors: validationErrors }
    );
  }
  
  if (error.name === 'SequelizeUniqueConstraintError') {
    const constraintErrors = error.errors.map(err => ({
      field: err.path,
      message: err.message,
      value: err.value
    }));
    
    return new ConflictError(
      'Unique constraint violation',
      'UNIQUE_CONSTRAINT_ERROR',
      { errors: constraintErrors }
    );
  }
  
  if (error.name === 'SequelizeForeignKeyConstraintError') {
    return new ValidationError(
      'Foreign key constraint error',
      'FOREIGN_KEY_CONSTRAINT_ERROR',
      { field: error.fields, table: error.table }
    );
  }
  
  if (error.name === 'SequelizeDatabaseError') {
    return new DatabaseError(
      'Database error',
      'DATABASE_ERROR',
      { message: error.message }
    );
  }
  
  return new ServerError(
    'Unexpected database error',
    'UNEXPECTED_DB_ERROR',
    { message: error.message }
  );
};

class CustomError extends Error {
  constructor(message, statusCode = 500, code = 'CUSTOM_ERROR', data = {}) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.data = data;
  }
}

module.exports = {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RateLimitError,
  ServerError,
  DatabaseError,
  ServiceUnavailableError,
  AuthenticationError,
  TokenExpiredError,
  InvalidTokenError,
  InvalidCredentialsError,
  ResourceNotFoundError,
  DuplicateResourceError,
  handleSequelizeError,
  CustomError,
}; 