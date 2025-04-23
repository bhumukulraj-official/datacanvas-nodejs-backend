const { redisClient } = require('../database');
const { TooManyRequestsError } = require('../errors');

/**
 * Rate limiter middleware factory
 * @param {string} endpoint The endpoint identifier
 * @param {number} maxRequests Maximum number of requests allowed in the time window
 * @param {number} windowMs Time window in milliseconds (default: 60000ms = 1 minute)
 * @returns {Function} Express middleware
 */
module.exports = function rateLimiter(endpoint, maxRequests = 10, windowMs = 60000) {
  return async (req, res, next) => {
    try {
      const ip = req.ip || req.connection.remoteAddress;
      const userId = req.user ? req.user.id : null;
      
      // Create a unique key for this IP/user and endpoint
      const key = `ratelimit:${endpoint}:${userId || ip}`;
      
      // Check if this key exists in Redis
      const current = await redisClient.get(key);
      
      if (current !== null && parseInt(current) >= maxRequests) {
        throw new TooManyRequestsError(`Rate limit exceeded for ${endpoint}`);
      }
      
      // Increment the counter
      const multi = redisClient.multi();
      multi.incr(key);
      
      // Set expiry if this is a new key
      if (!current) {
        multi.pexpire(key, windowMs);
      }
      
      await multi.exec();
      
      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', current === null ? maxRequests - 1 : maxRequests - parseInt(current) - 1);
      
      next();
    } catch (error) {
      next(error);
    }
  };
}; 