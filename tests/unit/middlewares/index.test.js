// Mock the apiLimiter middleware
jest.mock('../../../src/api/middlewares/rateLimit.middleware', () => 
  jest.fn((req, res, next) => next())
);

describe('Middleware Index', () => {
  it('should export all middlewares correctly', () => {
    // Import the index module
    const middlewares = require('../../../src/api/middlewares');

    // Check that all expected middlewares are exported
    expect(middlewares).toHaveProperty('authenticate');
    expect(middlewares).toHaveProperty('authorize');
    expect(middlewares).toHaveProperty('errorHandler');
    expect(middlewares).toHaveProperty('notFoundHandler');
    expect(middlewares).toHaveProperty('validate');
    expect(middlewares).toHaveProperty('apiLimiter');
    expect(middlewares).toHaveProperty('corsMiddleware');
    expect(middlewares).toHaveProperty('upload');
    expect(middlewares).toHaveProperty('processUpload');
    expect(middlewares).toHaveProperty('requestLogger');

    // Verify the exports are functions (or objects containing functions)
    expect(typeof middlewares.authenticate).toBe('function');
    expect(typeof middlewares.authorize).toBe('function');
    expect(typeof middlewares.errorHandler).toBe('function');
    expect(typeof middlewares.notFoundHandler).toBe('function');
    expect(typeof middlewares.validate).toBe('function');
    expect(typeof middlewares.apiLimiter).toBe('function');
    expect(typeof middlewares.corsMiddleware).toBe('function');
    expect(typeof middlewares.upload).toBe('object');
    expect(typeof middlewares.processUpload).toBe('function');
    expect(typeof middlewares.requestLogger).toBe('function');
  });
}); 