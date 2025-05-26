const httpMocks = require('node-mocks-http');

// Mock the logger
jest.mock('../../../src/utils/logger.util', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

// Import after mocks
const requestLogger = require('../../../src/api/middlewares/logging.middleware');
const logger = require('../../../src/utils/logger.util');

describe('Logging Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = httpMocks.createRequest({
      method: 'GET',
      url: '/api/test',
      ip: '127.0.0.1'
    });
    res = httpMocks.createResponse({
      eventEmitter: require('events').EventEmitter
    });
    next = jest.fn();
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock Date.now for consistent testing
    jest.spyOn(Date, 'now').mockImplementation(() => 1000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should call next() to continue the request', () => {
    // Act
    requestLogger(req, res, next);
    
    // Assert
    expect(next).toHaveBeenCalled();
  });

  it('should log request information when response finishes', () => {
    // Arrange
    req.user = { id: 'user123' };
    
    // Act
    requestLogger(req, res, next);
    
    // Set response status and trigger finish event
    res.statusCode = 200;
    res.emit('finish');
    
    // Assert
    expect(logger.info).toHaveBeenCalledWith({
      method: 'GET',
      path: '/api/test',
      status: 200,
      duration: '0ms',
      ip: '127.0.0.1',
      user: 'user123'
    });
  });

  it('should log anonymous user when no user is authenticated', () => {
    // Act
    requestLogger(req, res, next);
    
    // Set response status and trigger finish event
    res.statusCode = 401;
    res.emit('finish');
    
    // Assert
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        user: 'anonymous'
      })
    );
  });

  it('should calculate request duration correctly', () => {
    // Arrange
    const mockDateNow = jest.spyOn(Date, 'now');
    mockDateNow.mockReturnValueOnce(1000) // First call when middleware is invoked
             .mockReturnValueOnce(1500);  // Second call when response finishes
    
    // Act
    requestLogger(req, res, next);
    res.statusCode = 200;
    res.emit('finish');
    
    // Assert
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        duration: '500ms'
      })
    );
  });
}); 