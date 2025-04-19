const errorHandler = require('../../../../src/shared/middleware/error.middleware');
const { 
  AppError, 
  NotFoundError, 
  ValidationError, 
  AuthenticationError 
} = require('../../../../src/shared/errors');

// Mock the logger
jest.mock('../../../../src/shared/utils/logger', () => ({
  error: jest.fn()
}));

describe('Error Middleware', () => {
  // Mock Express request, response, and next
  let req;
  let res;
  let next;
  
  // Setup before each test
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock request
    req = {
      path: '/api/test',
      method: 'GET'
    };
    
    // Mock response
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    // Mock next
    next = jest.fn();
  });

  test('should handle AppError with correct status code and format', () => {
    // Create an application error
    const error = new NotFoundError('Resource not found');
    
    // Call the error handler
    errorHandler(error, req, res, next);
    
    // Verify response
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: expect.objectContaining({
        code: 'NOT_001',
        message: 'Resource not found'
      })
    }));
    
    // Next should not be called
    expect(next).not.toHaveBeenCalled();
  });

  test('should handle ValidationError with details', () => {
    // Create validation error with details
    const validationDetails = [
      { param: 'email', msg: 'Email is required' },
      { param: 'password', msg: 'Password must be at least 8 characters' }
    ];
    const error = new ValidationError('Validation failed', validationDetails);
    
    // Call the error handler
    errorHandler(error, req, res, next);
    
    // Verify response
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: expect.objectContaining({
        code: 'VAL_001',
        message: 'Validation failed',
        details: validationDetails
      })
    }));
  });

  test('should handle AuthenticationError', () => {
    // Create authentication error
    const error = new AuthenticationError('Invalid credentials');
    
    // Call the error handler
    errorHandler(error, req, res, next);
    
    // Verify response
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: expect.objectContaining({
        code: 'AUTH_001',
        message: 'Invalid credentials'
      })
    }));
  });

  test('should handle unknown errors as 500 Internal Server Error', () => {
    // Create a generic Error (not an AppError)
    const error = new Error('Something went wrong');
    
    // Call the error handler
    errorHandler(error, req, res, next);
    
    // Verify response
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: expect.objectContaining({
        code: 'SERVER_001',
        message: 'Internal server error'
      })
    }));
  });

  test('should log error details', () => {
    // Import logger
    const logger = require('../../../../src/shared/utils/logger');
    
    // Create an error
    const error = new Error('Test error');
    
    // Call the error handler
    errorHandler(error, req, res, next);
    
    // Verify logger was called with correct info
    expect(logger.error).toHaveBeenCalledWith(error.message, expect.objectContaining({
      stack: error.stack,
      path: req.path,
      method: req.method
    }));
  });

  test('should include stack trace in development environment', () => {
    // Save original NODE_ENV
    const originalNodeEnv = process.env.NODE_ENV;
    
    // Set to development
    process.env.NODE_ENV = 'development';
    
    // Create an error with stack trace
    const error = new Error('Test error');
    error.stack = 'Error: Test error\n    at Object.<anonymous> (/test.js:1:1)';
    
    // Call the error handler
    errorHandler(error, req, res, next);
    
    // Verify stack trace was included in development
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.objectContaining({
        stack: error.stack
      })
    }));
    
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalNodeEnv;
  });

  test('should not include stack trace in production environment', () => {
    // Save original NODE_ENV
    const originalNodeEnv = process.env.NODE_ENV;
    
    // Set to production
    process.env.NODE_ENV = 'production';
    
    // Create an error with stack trace
    const error = new Error('Test error');
    error.stack = 'Error: Test error\n    at Object.<anonymous> (/test.js:1:1)';
    
    // Call the error handler
    errorHandler(error, req, res, next);
    
    // Verify stack trace was not included in production
    expect(res.json).toHaveBeenCalledWith(expect.not.objectContaining({
      error: expect.objectContaining({
        stack: expect.anything()
      })
    }));
    
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalNodeEnv;
  });
}); 