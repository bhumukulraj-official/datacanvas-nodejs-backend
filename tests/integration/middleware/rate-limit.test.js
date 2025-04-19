const request = require('supertest');
const express = require('express');
const rateLimiter = require('../../../src/shared/middleware/rate-limit.middleware');
const { RateLimitError } = require('../../../src/shared/errors');
const errorHandler = require('../../../src/shared/middleware/error.middleware');

// Mock Redis for rate limiting
jest.mock('../../../src/shared/config/redis', () => {
  const mockRedis = {
    get: jest.fn(),
    set: jest.fn().mockResolvedValue('OK'),
    multi: jest.fn().mockReturnThis(),
    incr: jest.fn().mockReturnThis(),
    expire: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(['OK', 'OK'])
  };
  return mockRedis;
});

// Mock logger
jest.mock('../../../src/shared/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

describe('Rate Limiting Middleware Integration Tests', () => {
  let app;
  let redis;
  
  // Set up test app with routes and rate limiting
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Import Redis mock
    redis = require('../../../src/shared/config/redis');
    
    // Create Express app
    app = express();
    
    // Add JSON middleware
    app.use(express.json());
    
    // Create test routes with different rate limits
    app.get('/api/test', rateLimiter('api'), (req, res) => {
      res.status(200).json({ success: true, message: 'OK' });
    });
    
    app.get('/api/admin/test', rateLimiter('admin'), (req, res) => {
      res.status(200).json({ success: true, message: 'OK' });
    });
    
    app.get('/ws/test', rateLimiter('websocket'), (req, res) => {
      res.status(200).json({ success: true, message: 'OK' });
    });
    
    // Add error handler
    app.use(errorHandler);
  });
  
  describe('API Rate Limiting', () => {
    test('should allow requests under the limit', async () => {
      // Mock Redis to return count under limit
      redis.get.mockResolvedValue('50');
      
      const response = await request(app)
        .get('/api/test')
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(redis.get).toHaveBeenCalled();
      expect(redis.multi).toHaveBeenCalled();
    });
    
    test('should set rate limit headers', async () => {
      // Mock Redis to return count under limit
      redis.get.mockResolvedValue('50');
      
      const response = await request(app)
        .get('/api/test');
      
      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
      expect(response.headers).toHaveProperty('x-ratelimit-reset');
    });
    
    test('should reject requests over the limit', async () => {
      // Mock Redis to return count at limit
      redis.get.mockResolvedValue('100');
      
      const response = await request(app)
        .get('/api/test')
        .expect(429);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'RATE_001');
      expect(response.body.error).toHaveProperty('message', 'Too many requests, please try again later');
      expect(redis.get).toHaveBeenCalled();
      expect(redis.multi).not.toHaveBeenCalled(); // Should not increment counter
    });
    
    test('should set retry headers when rate limited', async () => {
      // Mock Redis to return count at limit
      redis.get.mockResolvedValue('100');
      
      const response = await request(app)
        .get('/api/test')
        .expect(429);
      
      expect(response.headers).toHaveProperty('retry-after');
      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining', '0');
    });
  });
  
  describe('Different Rate Limit Types', () => {
    test('should apply higher limits for admin endpoints', async () => {
      // Mock Redis to return count under admin limit but over API limit
      redis.get.mockResolvedValue('500');
      
      const response = await request(app)
        .get('/api/admin/test')
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(redis.get).toHaveBeenCalled();
      
      // Now with the same count, API endpoint should be rate limited
      redis.get.mockResolvedValue('500');
      
      const apiResponse = await request(app)
        .get('/api/test')
        .expect(429);
      
      expect(apiResponse.body).toHaveProperty('success', false);
    });
    
    test('should apply stricter limits for websocket endpoints', async () => {
      // Mock Redis to return count at websocket limit
      redis.get.mockResolvedValue('10');
      
      const response = await request(app)
        .get('/ws/test')
        .expect(429);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'RATE_001');
      
      // Now with the same count, API endpoint should still work
      redis.get.mockResolvedValue('10');
      
      const apiResponse = await request(app)
        .get('/api/test')
        .expect(200);
      
      expect(apiResponse.body).toHaveProperty('success', true);
    });
  });
  
  describe('IP-based Tracking', () => {
    test('should use client IP in rate limit key', async () => {
      // Mock Redis to return null (first request)
      redis.get.mockResolvedValue(null);
      
      await request(app)
        .get('/api/test')
        .set('X-Forwarded-For', '192.168.1.1')
        .expect(200);
      
      // Check that the rate limit key includes the IP
      const calls = redis.get.mock.calls;
      const firstCall = calls[0];
      const rateKey = firstCall[0];
      expect(rateKey).toContain('192.168.1.1');
    });
    
    test('should track different IPs separately', async () => {
      // First IP under limit
      redis.get.mockImplementation((key) => {
        if (key.includes('192.168.1.1')) return Promise.resolve('50');
        if (key.includes('192.168.1.2')) return Promise.resolve('100');
        return Promise.resolve(null);
      });
      
      // First IP should work
      const response1 = await request(app)
        .get('/api/test')
        .set('X-Forwarded-For', '192.168.1.1')
        .expect(200);
      
      expect(response1.body).toHaveProperty('success', true);
      
      // Second IP should be rate limited
      const response2 = await request(app)
        .get('/api/test')
        .set('X-Forwarded-For', '192.168.1.2')
        .expect(429);
      
      expect(response2.body).toHaveProperty('success', false);
    });
  });
  
  describe('Error Handling', () => {
    test('should handle Redis errors gracefully', async () => {
      // Mock Redis to throw error
      redis.get.mockRejectedValue(new Error('Redis connection error'));
      
      const response = await request(app)
        .get('/api/test')
        .expect(500);
      
      expect(response.body).toHaveProperty('success', false);
    });
  });
}); 