/**
 * Cache Module
 * Provides Redis caching functionality for the application
 */
const Redis = require('ioredis');
const config = require('../config');
const logger = require('../utils/logger');

// Initialize Redis client if enabled in config
let redisClient = null;

if (config.cache.enabled) {
  redisClient = new Redis({
    host: config.cache.host,
    port: config.cache.port,
    password: config.cache.password,
    db: config.cache.db,
    keyPrefix: config.cache.keyPrefix,
    retryStrategy: (times) => {
      if (times > 3) {
        logger.warn('Redis connection retry limit reached');
        return null;
      }
      return Math.min(times * 100, 3000);
    }
  });

  redisClient.on('error', (err) => {
    logger.error('Redis connection error', err);
    // Don't crash the server on Redis errors
  });

  redisClient.on('connect', () => {
    logger.info('Redis connected successfully');
  });
} else {
  // Create a mock Redis client for environments without Redis
  redisClient = {
    get: async () => null,
    set: async () => true,
    del: async () => true,
    setex: async () => true,
    flushdb: async () => true,
    keys: async () => [],
  };
  logger.info('Using mock Redis cache (caching disabled)');
}

/**
 * Cache middleware for API responses
 * @param {number} duration - Cache duration in seconds
 * @returns {Function} Express middleware
 */
const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    if (!config.cache.enabled || req.method !== 'GET') {
      return next();
    }

    // Create a unique cache key based on the request
    const cacheKey = `api:${req.originalUrl}:${JSON.stringify(req.query)}`;
    
    try {
      const cachedData = await redisClient.get(cacheKey);
      
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        return res.status(200).json({
          ...parsedData,
          _cached: true
        });
      }
      
      // Store the original json method
      const originalJson = res.json;
      
      // Override the json method to cache the response
      res.json = function(data) {
        if (res.statusCode === 200 && data.success) {
          redisClient.setex(cacheKey, duration, JSON.stringify(data));
        }
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      logger.error('Cache middleware error', error);
      next();
    }
  };
};

/**
 * Clear cache keys matching a pattern
 * @param {string} pattern - Key pattern to clear
 */
const clearCacheByPattern = async (pattern) => {
  if (!config.cache.enabled) return;
  
  try {
    const keys = await redisClient.keys(`${config.cache.keyPrefix}${pattern}`);
    
    if (keys.length > 0) {
      // Strip the prefix for the multi delete command
      const keysWithoutPrefix = keys.map(k => 
        k.replace(config.cache.keyPrefix, '')
      );
      
      await redisClient.del(...keysWithoutPrefix);
      logger.info(`Cleared ${keys.length} cache keys matching: ${pattern}`);
    }
  } catch (error) {
    logger.error('Error clearing cache', error);
  }
};

module.exports = {
  redisClient,
  cacheMiddleware,
  clearCacheByPattern
}; 