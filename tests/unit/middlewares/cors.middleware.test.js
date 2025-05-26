const cors = require('cors');

// Mock the cors library
jest.mock('cors', () => jest.fn(() => (req, res, next) => next()));

// Mock the config
jest.mock('../../../src/config/security', () => ({
  cors: {
    origin: ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-Total-Count'],
    credentials: true,
    maxAge: 86400
  }
}));

describe('CORS Middleware', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
  });
  
  it('should configure cors with the correct options', () => {
    // Import the middleware (must be after mocks)
    const corsMiddleware = require('../../../src/api/middlewares/cors.middleware');
    const { cors: corsConfig } = require('../../../src/config/security');
    
    // Verify cors was called with the right configuration
    expect(cors).toHaveBeenCalledWith({
      origin: corsConfig.origin,
      methods: corsConfig.methods,
      allowedHeaders: corsConfig.allowedHeaders,
      exposedHeaders: corsConfig.exposedHeaders,
      credentials: corsConfig.credentials,
      maxAge: corsConfig.maxAge
    });
    
    // Verify the middleware is a function
    expect(typeof corsMiddleware).toBe('function');
  });
}); 