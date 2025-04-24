/**
 * Enhanced API Key Middleware
 * Provides API key authentication with rate limiting support
 */
const apiKeyService = require('../services/unified-api-key.service');
const { AuthenticationError, RateLimitError } = require('../../../shared/errors');
const logger = require('../../../shared/utils/logger');
const { promisify } = require('util');
const { createClient } = require('redis');

// Configure Redis client for rate limiting
let redisClient;
try {
  // Try to initialize Redis client
  redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });
  
  redisClient.on('error', (err) => {
    logger.error('Redis error:', err);
    // Use in-memory fallback if Redis connection fails
  });
} catch (error) {
  logger.warn('Redis client initialization failed, using in-memory rate limiting fallback');
}

// In-memory rate limit storage as fallback
const inMemoryRateLimits = new Map();

/**
 * Clean up expired in-memory rate limits every 5 minutes
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of inMemoryRateLimits.entries()) {
    if (data.resetAt < now) {
      inMemoryRateLimits.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Apply rate limiting for an API key
 * @param {Object} apiKeyObj - API key object
 * @param {string} identifier - Request identifier (IP, endpoint)
 * @returns {Promise<Object>} Rate limit info
 */
const applyRateLimit = async (apiKeyObj, identifier) => {
  const keyId = apiKeyObj.id;
  const rateLimit = 100; // Default rate limit per minute
  const limitKey = `ratelimit:${keyId}:${identifier}`;
  
  // Rate limit info to return
  let rateLimitInfo = {
    limit: rateLimit,
    remaining: 0,
    reset: 0,
    limited: false
  };
  
  try {
    if (redisClient && redisClient.isReady) {
      // Using Redis for distributed rate limiting
      const multi = redisClient.multi();
      
      // Get current count
      const count = await redisClient.get(limitKey) || 0;
      
      // Get TTL for the key
      const ttl = await redisClient.ttl(limitKey) || 60;
      
      if (count >= rateLimit) {
        // Rate limit exceeded
        rateLimitInfo.remaining = 0;
        rateLimitInfo.reset = ttl;
        rateLimitInfo.limited = true;
        return rateLimitInfo;
      }
      
      // Increment the counter
      await redisClient.incr(limitKey);
      
      // Set expiry if this was the first request in the window
      if (count === 0) {
        await redisClient.expire(limitKey, 60); // 1 minute window
      }
      
      rateLimitInfo.remaining = rateLimit - (parseInt(count) + 1);
      rateLimitInfo.reset = ttl;
      
      return rateLimitInfo;
    } else {
      // Fallback to in-memory rate limiting
      const now = Date.now();
      
      if (!inMemoryRateLimits.has(limitKey)) {
        // First request in this window
        inMemoryRateLimits.set(limitKey, {
          count: 1,
          resetAt: now + 60000 // 1 minute from now
        });
        
        rateLimitInfo.remaining = rateLimit - 1;
        rateLimitInfo.reset = 60;
        
        return rateLimitInfo;
      }
      
      const limitData = inMemoryRateLimits.get(limitKey);
      
      // Check if the window has expired
      if (limitData.resetAt <= now) {
        // Reset window
        inMemoryRateLimits.set(limitKey, {
          count: 1,
          resetAt: now + 60000
        });
        
        rateLimitInfo.remaining = rateLimit - 1;
        rateLimitInfo.reset = 60;
        
        return rateLimitInfo;
      }
      
      // Check if rate limit is exceeded
      if (limitData.count >= rateLimit) {
        rateLimitInfo.remaining = 0;
        rateLimitInfo.reset = Math.ceil((limitData.resetAt - now) / 1000);
        rateLimitInfo.limited = true;
        
        return rateLimitInfo;
      }
      
      // Increment counter
      limitData.count += 1;
      inMemoryRateLimits.set(limitKey, limitData);
      
      rateLimitInfo.remaining = rateLimit - limitData.count;
      rateLimitInfo.reset = Math.ceil((limitData.resetAt - now) / 1000);
      
      return rateLimitInfo;
    }
  } catch (error) {
    logger.error('Rate limiting error', { error, keyId });
    
    // Allow the request to proceed if rate limiting fails
    rateLimitInfo.remaining = 1;
    rateLimitInfo.reset = 60;
    
    return rateLimitInfo;
  }
};

/**
 * Middleware to authenticate and rate limit requests using API key
 * Extracts API key from x-api-key header and validates it
 */
const requireApiKey = async (req, res, next) => {
  try {
    const apiKey = req.header('x-api-key');
    
    if (!apiKey) {
      throw new AuthenticationError('API key is required');
    }
    
    const apiKeyObj = await apiKeyService.validateApiKey(apiKey);
    
    if (!apiKeyObj) {
      logger.warn('Invalid API key provided', { 
        ip: req.ip || req.connection.remoteAddress,
        endpoint: req.originalUrl
      });
      throw new AuthenticationError('Invalid API key');
    }
    
    // Apply rate limiting
    const identifier = `${req.method}:${req.baseUrl}${req.path}`;
    const rateLimitInfo = await applyRateLimit(apiKeyObj, identifier);
    
    // Set rate limit headers
    res.set('X-RateLimit-Limit', rateLimitInfo.limit.toString());
    res.set('X-RateLimit-Remaining', rateLimitInfo.remaining.toString());
    res.set('X-RateLimit-Reset', rateLimitInfo.reset.toString());
    
    // Check if rate limited
    if (rateLimitInfo.limited) {
      logger.warn('API key rate limit exceeded', {
        keyId: apiKeyObj.id,
        keyName: apiKeyObj.name,
        ip: req.ip || req.connection.remoteAddress,
        endpoint: req.originalUrl
      });
      
      return res.status(429).json({
        success: false,
        error: {
          message: 'Rate limit exceeded. Try again later.',
          code: 'RATE_001'
        },
        timestamp: new Date().toISOString()
      });
    }
    
    // Map permissions to descriptive capabilities
    const mappedPermissions = apiKeyObj.permissions.map(permId => {
      return apiKeyService.PERMISSION_MAP[permId] || 
        { name: `unknown:${permId}`, description: 'Unknown permission' };
    });
    
    // Attach API key info to request for further use
    req.apiKey = {
      id: apiKeyObj.id,
      name: apiKeyObj.name,
      permissions: apiKeyObj.permissions,
      mappedPermissions
    };
    
    logger.info(`Request authenticated with API key: ${apiKeyObj.id}`);
    
    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return res.status(401).json({
        success: false,
        error: {
          message: error.message,
          code: 'AUTH_004'
        },
        timestamp: new Date().toISOString()
      });
    }
    
    logger.error(`API key authentication error: ${error.message}`);
    
    return res.status(500).json({
      success: false,
      error: {
        message: 'Authentication failed',
        code: 'AUTH_005'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Middleware to check API key permissions
 * @param {Array|String} requiredPermissions - Required permission IDs or names
 */
const requirePermission = (requiredPermissions) => {
  const permissions = Array.isArray(requiredPermissions) 
    ? requiredPermissions 
    : [requiredPermissions];
  
  return (req, res, next) => {
    try {
      if (!req.apiKey) {
        throw new AuthenticationError('API key is required');
      }
      
      const hasPermission = permissions.some(permission => {
        // Check if permission is a numeric ID or a string name
        if (typeof permission === 'number') {
          return req.apiKey.permissions.includes(permission);
        } else if (typeof permission === 'string') {
          return req.apiKey.mappedPermissions.some(p => p.name === permission);
        }
        return false;
      });
      
      if (!hasPermission) {
        logger.warn('API key permission denied', {
          keyId: req.apiKey.id,
          requiredPermissions: permissions,
          actualPermissions: req.apiKey.permissions
        });
        
        return res.status(403).json({
          success: false,
          error: {
            message: 'You do not have the required permissions',
            code: 'AUTH_006'
          },
          timestamp: new Date().toISOString()
        });
      }
      
      next();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return res.status(401).json({
          success: false,
          error: {
            message: error.message,
            code: 'AUTH_007'
          },
          timestamp: new Date().toISOString()
        });
      }
      
      logger.error(`API key permission error: ${error.message}`);
      
      return res.status(500).json({
        success: false,
        error: {
          message: 'Permission check failed',
          code: 'AUTH_008'
        },
        timestamp: new Date().toISOString()
      });
    }
  };
};

module.exports = {
  requireApiKey,
  requirePermission
}; 