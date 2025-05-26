const httpMocks = require('node-mocks-http');

// Mock the error util with a mock implementation
jest.mock('../../../src/utils/error.util', () => {
  // Create a mock CustomError class
  class MockCustomError extends Error {
    constructor(message, statusCode, errorCode, data) {
      super(message);
      this.name = 'CustomError';
      this.statusCode = statusCode || 500;
      this.errorCode = errorCode || 'SERVER_ERROR';
      this.data = data;
    }
  }
  
  return {
    CustomError: MockCustomError
  };
});

// Mock the logger
jest.mock('../../../src/utils/logger.util', () => ({
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn()
}));

// Import the middleware after mocks
const { errorHandler, notFoundHandler } = require('../../../src/api/middlewares/error.middleware');
const logger = require('../../../src/utils/logger.util');
const { CustomError } = require('../../../src/utils/error.util');

describe('Error Middleware', () => {
  let req, res, next;
  let originalNodeEnv;

  beforeEach(() => {
    req = httpMocks.createRequest();
    res = httpMocks.createResponse();
    next = jest.fn();
    
    // Reset mocks
    jest.clearAllMocks();

    // Save original NODE_ENV
    originalNodeEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('errorHandler', () => {
    it('should handle CustomError with proper status code and response', () => {
      // Arrange
      const error = new CustomError('Test error message', 400, 'TEST_ERROR', { field: 'test' });
      
      // Act
      errorHandler(error, req, res, next);
      
      // Assert
      expect(logger.error).toHaveBeenCalled();
      expect(res.statusCode).toBe(400);
      expect(res._getJSONData()).toEqual({
        success: false,
        error: {
          code: 'TEST_ERROR',
          message: 'Test error message',
          details: { field: 'test' }
        }
      });
    });

    it('should handle regular Error with 500 status code', () => {
      // Arrange
      const error = new Error('Internal server error');
      
      // Act
      errorHandler(error, req, res, next);
      
      // Assert
      expect(logger.error).toHaveBeenCalled();
      expect(res.statusCode).toBe(500);
      expect(res._getJSONData()).toEqual({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Internal server error'
        }
      });
    });

    it('should include stack trace in development environment', () => {
      // Arrange
      process.env.NODE_ENV = 'development';
      const error = new Error('Development error');
      error.stack = 'Error stack trace';
      
      // Act
      errorHandler(error, req, res, next);
      
      // Assert
      expect(res._getJSONData().error).toHaveProperty('stack', 'Error stack trace');
    });

    it('should not include stack trace in production environment', () => {
      // Arrange
      process.env.NODE_ENV = 'production';
      const error = new Error('Production error');
      error.stack = 'Error stack trace';
      
      // Act
      errorHandler(error, req, res, next);
      
      // Assert
      expect(res._getJSONData().error).not.toHaveProperty('stack');
    });
  });

  describe('notFoundHandler', () => {
    it('should throw a CustomError for route not found', () => {
      // Arrange
      req.method = 'GET';
      req.path = '/not-found';
      
      // Act & Assert
      expect(() => notFoundHandler(req, res)).toThrow(CustomError);
      expect(() => notFoundHandler(req, res)).toThrow('Route GET /not-found not found');
    });
  });
}); 