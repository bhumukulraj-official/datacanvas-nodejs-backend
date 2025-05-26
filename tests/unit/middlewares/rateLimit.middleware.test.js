const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default;
const { CustomError } = require('../../../src/utils/error.util');

// Mock redis
jest.mock('../../../src/config', () => ({
  redis: {
    client: {
      sendCommand: jest.fn().mockResolvedValue('OK')
    }
  }
}));

// Mock rate-limit-redis
jest.mock('rate-limit-redis', () => ({
  default: jest.fn().mockImplementation(() => ({
    init: jest.fn(),
    incr: jest.fn(),
    decrement: jest.fn(),
    resetKey: jest.fn(),
    resetAll: jest.fn()
  }))
}));

// Mock express-rate-limit
jest.mock('express-rate-limit', () => jest.fn().mockImplementation((options) => {
  const middleware = (req, res, next) => {
    if (req.simulateRateLimitExceeded) {
      options.handler(req, res, next);
    } else {
      next();
    }
  };
  middleware.resetKey = jest.fn();
  return middleware;
}));

// Mock security config
jest.mock('../../../src/config/security', () => ({
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  }
}));

describe('Rate Limit Middleware', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should initialize with Redis store and correct options', () => {
    // Import the middleware (after mocks)
    const apiLimiter = require('../../../src/api/middlewares/rateLimit.middleware');
    const { rateLimit: rateLimitConfig } = require('../../../src/config/security');
    
    // Verify express-rate-limit was called with correct options
    expect(rateLimit).toHaveBeenCalledWith(expect.objectContaining({
      windowMs: rateLimitConfig.windowMs,
      max: rateLimitConfig.max,
      standardHeaders: true,
      legacyHeaders: false,
      store: expect.any(Object),
      handler: expect.any(Function)
    }));
    
    // Verify RedisStore was initialized
    expect(RedisStore).toHaveBeenCalled();
  });

  it('should throw CustomError when rate limit is exceeded', () => {
    // Import the middleware (after mocks)
    const apiLimiter = require('../../../src/api/middlewares/rateLimit.middleware');
    
    // Create mock request and response
    const req = { simulateRateLimitExceeded: true };
    const res = {};
    const next = jest.fn();
    
    // Execute middleware and check if it throws
    expect(() => {
      apiLimiter(req, res, next);
    }).toThrow(CustomError);
    
    // Ensure next was not called
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next() when rate limit is not exceeded', () => {
    // Import the middleware (after mocks)
    const apiLimiter = require('../../../src/api/middlewares/rateLimit.middleware');
    
    // Create mock request and response
    const req = { simulateRateLimitExceeded: false };
    const res = {};
    const next = jest.fn();
    
    // Execute middleware
    apiLimiter(req, res, next);
    
    // Verify next was called
    expect(next).toHaveBeenCalled();
  });
}); 