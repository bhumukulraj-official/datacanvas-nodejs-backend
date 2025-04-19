const redis = require('../config/redis');
const logger = require('./logger');

const DEFAULT_TTL = 3600; // 1 hour in seconds

/**
 * Get data from cache
 * @param {string} key Cache key
 * @returns {Promise<any>} Cached data or null
 */
exports.get = async (key) => {
  try {
    const cachedData = await redis.get(key);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    return null;
  } catch (error) {
    logger.error(`Error getting data from cache: ${error.message}`, { key });
    return null;
  }
};

/**
 * Set data in cache
 * @param {string} key Cache key
 * @param {any} data Data to cache
 * @param {number} ttl Time to live in seconds
 */
exports.set = async (key, data, ttl = DEFAULT_TTL) => {
  try {
    await redis.set(key, JSON.stringify(data), 'EX', ttl);
  } catch (error) {
    logger.error(`Error setting data in cache: ${error.message}`, { key });
  }
};

/**
 * Delete data from cache
 * @param {string} key Cache key
 */
exports.del = async (key) => {
  try {
    await redis.del(key);
  } catch (error) {
    logger.error(`Error deleting data from cache: ${error.message}`, { key });
  }
};

/**
 * Delete data from cache with pattern matching
 * @param {string} pattern Key pattern to match (e.g., "projects:list:*")
 */
exports.delByPattern = async (pattern) => {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length) {
      await redis.del(keys);
    }
  } catch (error) {
    logger.error(`Error deleting data from cache by pattern: ${error.message}`, { pattern });
  }
};

/**
 * Cache wrapper for service methods
 * @param {Function} fn Service method to cache
 * @param {string} keyPrefix Cache key prefix
 * @param {number} ttl Cache TTL in seconds
 * @returns {Function} Wrapped function with caching
 */
exports.cacheWrapper = (fn, keyPrefix, ttl = DEFAULT_TTL) => {
  return async (...args) => {
    // Create a unique cache key based on the function arguments
    const key = `${keyPrefix}:${JSON.stringify(args)}`;
    
    // Try to get data from cache
    const cachedData = await this.get(key);
    if (cachedData) {
      logger.debug(`Cache hit for key: ${key}`);
      return cachedData;
    }
    
    // Execute function and cache result
    logger.debug(`Cache miss for key: ${key}`);
    const result = await fn(...args);
    await this.set(key, result, ttl);
    
    return result;
  };
}; 