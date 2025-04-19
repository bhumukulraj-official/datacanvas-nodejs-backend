/**
 * Rate limiting middleware using Redis
 * Implements different rate limits for different API endpoint types:
 * - General API endpoints: 100 requests per minute
 * - Admin API endpoints: 1000 requests per minute
 * - WebSocket connections: 10 per second
 */
const redis = require('../config/redis');
const { RateLimitError } = require('../errors');
const logger = require('../utils/logger');

// Rate limit configuration
const rateLimits = {
  // General API endpoints: 100 requests per minute
  api: {
    points: 100,
    duration: 60, // seconds
  },
  // Admin API endpoints: 1000 requests per minute
  admin: {
    points: 1000,
    duration: 60,
  },
  // WebSocket connections: 10 per second
  websocket: {
    points: 10,
    duration: 1,
  }
};

/**
 * Redis-based rate limiting middleware
 * @param {string} type Rate limit type (api, admin, websocket)
 * @returns {Function} Express middleware
 */
const rateLimiter = (type = 'api') => {
  return async (req, res, next) => {
    try {
      const ip = req.ip || req.connection.remoteAddress;
      const endpoint = req.originalUrl || req.url;
      const key = `rate_limit:${type}:${ip}`;
      
      // Get current count for this IP and endpoint
      let current = await redis.get(key);
      current = current ? parseInt(current, 10) : 0;
      
      const limit = rateLimits[type] || rateLimits.api;
      
      if (current >= limit.points) {
        // Rate limit exceeded
        logger.warn(`Rate limit exceeded: ${ip} on ${endpoint}`, { 
          ip, endpoint, limit: limit.points, current 
        });
        
        // Set headers and return error
        res.set({
          'X-RateLimit-Limit': limit.points,
          'X-RateLimit-Remaining': 0,
          'X-RateLimit-Reset': Math.floor(Date.now() / 1000) + limit.duration,
          'Retry-After': limit.duration
        });
        
        throw new RateLimitError('Rate limit exceeded');
      }
      
      // Increment counter
      await redis.multi()
        .incr(key)
        .expire(key, limit.duration)
        .exec();
      
      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': limit.points,
        'X-RateLimit-Remaining': limit.points - current - 1,
        'X-RateLimit-Reset': Math.floor(Date.now() / 1000) + limit.duration
      });
      
      next();
    } catch (error) {
      if (error instanceof RateLimitError) {
        return res.status(429).json({
          success: false,
          error: {
            code: 'RATE_001',
            message: 'Too many requests, please try again later',
            details: { retryAfter: rateLimits[type].duration },
            timestamp: new Date().toISOString()
          }
        });
      }
      next(error);
    }
  };
};

module.exports = rateLimiter; 