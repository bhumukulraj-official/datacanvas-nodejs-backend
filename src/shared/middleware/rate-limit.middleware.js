/**
 * Enhanced rate limiting middleware with progressive delays and dynamic limits
 * Protects against brute force and DoS attacks
 */
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const { createClient } = require('redis');
const { AppError } = require('../errors');
const iputil = require('../utils/ip.util');
const logger = require('../utils/logger');
const RateLimit = require('../../modules/security/models/RateLimit');

// Connect to Redis if available, otherwise use in-memory store
let redisClient;
const redisEnabled = process.env.REDIS_URL && process.env.RATE_LIMIT_USE_REDIS === 'true';

if (redisEnabled) {
  redisClient = createClient({
    url: process.env.REDIS_URL,
    legacyMode: false
  });
  
  redisClient.on('error', (err) => {
    logger.error('Redis rate limit error', err);
  });
  
  // Connect to Redis (this is async but we're not awaiting it)
  redisClient.connect().catch((err) => {
    logger.error('Redis connection error', err);
  });
}

/**
 * Enhanced API rate limiter middleware with progressive delays
 * @param {Object} options - Rate limiter options
 * @returns {Function} Express middleware
 */
exports.apiRateLimiter = (options = {}) => {
  const config = {
    // Default options
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    standardHeaders: true, // Return rate limit info in the RateLimit-* headers
    legacyHeaders: false, // Don't use the X-RateLimit-* headers
    handler: (req, res, next, options) => {
      // Enhanced error response
      const resetTime = new Date(Date.now() + options.windowMs);
      const resetTimeIso = resetTime.toISOString();
      const resetTimeSeconds = Math.ceil(options.resetTime / 1000);
      
      // Log rate limit event for security monitoring
      logger.warn('Rate limit exceeded', {
        ip: iputil.getClientIp(req),
        path: req.path,
        method: req.method,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id || null,
        pointsConsumed: req.rateLimit?.currentUsage || 0,
        pointsLimit: options.max,
        resetTime: resetTimeIso
      });
      
      // Store rate limit event in database for analysis
      RateLimit.create({
        ip_address: iputil.getClientIp(req),
        endpoint: req.path,
        request_count: req.rateLimit?.currentUsage || 0,
        window_start: new Date(Date.now() - options.windowMs),
        window_end: resetTime,
        api_type: 'public',
        user_id: req.user?.id || null
      }).catch(err => {
        logger.error('Failed to store rate limit event', err);
      });
      
      // Return standardized error response
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_001',
          message: 'Too many requests, please try again later',
          details: {
            resetAt: resetTimeIso,
            resetAfter: resetTimeSeconds,
            limit: options.max
          }
        }
      });
    },
    // Custom skip function
    skip: (req, res) => {
      // Skip rate limiting for health check and OPTIONS requests
      return req.path === '/health' || req.method === 'OPTIONS';
    },
    // Override provided options
    ...options
  };

  // Use Redis store if available
  if (redisEnabled && redisClient) {
    config.store = new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
      prefix: 'ratelimit:'
    });
  }

  return rateLimit(config);
};

/**
 * Special rate limiter for authentication endpoints with progressive delays
 * @returns {Function} Express middleware
 */
exports.authRateLimiter = () => {
  return exports.apiRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 30, // Max 30 requests per hour
    keyGenerator: (req) => {
      // Use combination of IP and username/email if available for login attempts
      const ip = iputil.getClientIp(req);
      
      if (req.body.emailOrUsername || req.body.email || req.body.username) {
        const identifier = req.body.emailOrUsername || req.body.email || req.body.username;
        return `auth:${ip}:${identifier.toLowerCase()}`;
      }
      
      return `auth:${ip}`;
    },
    handler: (req, res, next, options) => {
      // Calculate progressive delay based on number of attempts
      const attempts = req.rateLimit.currentUsage;
      const delayMinutes = Math.min(60, Math.pow(2, attempts - options.max)); // Exponential backoff
      const resetTime = new Date(Date.now() + (delayMinutes * 60 * 1000));
      
      // Log authentication rate limit for security monitoring
      logger.warn('Authentication rate limit exceeded', {
        ip: iputil.getClientIp(req),
        identifier: req.body.emailOrUsername || req.body.email || req.body.username || 'unknown',
        path: req.path,
        attempts: attempts,
        delayMinutes: delayMinutes
      });
      
      // Record in database for security monitoring
      RateLimit.create({
        ip_address: iputil.getClientIp(req),
        endpoint: req.path,
        request_count: attempts,
        window_start: new Date(Date.now() - options.windowMs),
        window_end: resetTime,
        api_type: 'auth',
        user_id: req.user?.id || null
      }).catch(err => {
        logger.error('Failed to store auth rate limit event', err);
      });
      
      // Return error with progressive delay information
      return res.status(429).json({
        success: false,
        error: {
          code: 'AUTH_RL_001',
          message: `Too many authentication attempts, please try again after ${delayMinutes} ${delayMinutes === 1 ? 'minute' : 'minutes'}`,
          details: {
            resetAt: resetTime.toISOString(),
            delayMinutes: delayMinutes
          }
        }
      });
    }
  });
};

/**
 * Anti-brute force middleware for password reset and account recovery
 * More strict than standard auth rate limiter
 * @returns {Function} Express middleware
 */
exports.accountRecoveryRateLimiter = () => {
  return exports.apiRateLimiter({
    windowMs: 24 * 60 * 60 * 1000, // 24 hour window
    max: 5, // Only 5 password reset attempts per day
    keyGenerator: (req) => {
      const ip = iputil.getClientIp(req);
      
      if (req.body.email) {
        return `recovery:${ip}:${req.body.email.toLowerCase()}`;
      }
      
      return `recovery:${ip}`;
    },
    handler: (req, res, next, options) => {
      logger.warn('Account recovery rate limit exceeded', {
        ip: iputil.getClientIp(req),
        email: req.body.email || 'unknown',
        path: req.path
      });
      
      // Store in database with longer retention for security analysis
      RateLimit.create({
        ip_address: iputil.getClientIp(req),
        endpoint: req.path,
        request_count: req.rateLimit.currentUsage,
        window_start: new Date(Date.now() - options.windowMs),
        window_end: new Date(Date.now() + options.windowMs),
        api_type: 'recovery',
        user_id: null
      }).catch(err => {
        logger.error('Failed to store recovery rate limit event', err);
      });
      
      // Return generic message to prevent user enumeration
      return res.status(429).json({
        success: false,
        error: {
          code: 'AUTH_RL_002',
          message: 'For security reasons, please try again tomorrow or contact support',
          details: {
            resetAt: new Date(Date.now() + options.windowMs).toISOString()
          }
        }
      });
    }
  });
};

/**
 * API key rate limiter for different tiers of access
 * @param {string} tier - API tier (free, basic, premium, etc.)
 * @returns {Function} Express middleware
 */
exports.apiKeyRateLimiter = (tier = 'free') => {
  // Define limits based on tier
  const limits = {
    free: { windowMs: 60 * 1000, max: 10 }, // 10 per minute
    basic: { windowMs: 60 * 1000, max: 60 }, // 60 per minute
    premium: { windowMs: 60 * 1000, max: 600 }, // 600 per minute
    enterprise: { windowMs: 60 * 1000, max: 6000 } // 6000 per minute
  };
  
  const tierConfig = limits[tier] || limits.free;
  
  return exports.apiRateLimiter({
    windowMs: tierConfig.windowMs,
    max: tierConfig.max,
    keyGenerator: (req) => {
      // Use API key from header or query for rate limiting
      const apiKey = req.get('X-API-Key') || req.query.apiKey || 'unknown';
      return `apikey:${apiKey}`;
    },
    handler: (req, res, next, options) => {
      logger.warn('API key rate limit exceeded', {
        apiKey: req.get('X-API-Key') || req.query.apiKey || 'unknown',
        tier: tier,
        path: req.path
      });
      
      return res.status(429).json({
        success: false,
        error: {
          code: 'API_RL_001',
          message: `Rate limit exceeded for ${tier} tier`,
          details: {
            tier: tier,
            limit: tierConfig.max,
            period: tierConfig.windowMs / 1000 + 's',
            resetAt: new Date(Date.now() + tierConfig.windowMs).toISOString()
          }
        }
      });
    }
  });
}; 