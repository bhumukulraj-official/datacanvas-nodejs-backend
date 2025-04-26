/**
 * ApiError utility module
 * Re-exports the AppError class and related error classes from the errors directory
 */
const {
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
  WebSocketError,
  ConflictError,
  TooManyRequestsError,
  ServerError
} = require('../../shared/errors');

// Re-export all error classes
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
  WebSocketError,
  ConflictError,
  TooManyRequestsError,
  ServerError
}; 