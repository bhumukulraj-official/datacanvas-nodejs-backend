/**
 * Cache utility for Redis-based caching
 * Provides methods for get/set/del operations and a wrapper for service methods
 */
const redis = require('../config/redis');
const logger = require('./logger');

// Default TTL for cache items (1 hour)
const DEFAULT_TTL = 3600;

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
      logger.debug(`Deleted ${keys.length} keys matching pattern: ${pattern}`);
    }
  } catch (error) {
    logger.error(`Error deleting data from cache by pattern: ${error.message}`, { pattern });
  }
};

/**
 * Generate cache key from prefix and arguments
 * @param {string} prefix Key prefix
 * @param {...any} args Arguments to include in key
 * @returns {string} Generated cache key
 */
exports.generateKey = (prefix, ...args) => {
  const argString = args.map(arg => {
    if (typeof arg === 'object') {
      return JSON.stringify(arg);
    }
    return String(arg);
  }).join(':');
  
  return `${prefix}:${argString}`;
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
    const key = this.generateKey(keyPrefix, ...args);
    
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

/**
 * Clear cache for specific entity
 * @param {string} entity Entity name (e.g., "projects", "users")
 * @param {string} id Entity ID
 */
exports.clearEntityCache = async (entity, id) => {
  try {
    // Clear specific entity
    if (id) {
      await this.del(`${entity}:${id}`);
    }
    
    // Clear entity lists
    await this.delByPattern(`${entity}:list:*`);
    
    logger.debug(`Cleared cache for ${entity}${id ? ` with ID ${id}` : ''}`);
  } catch (error) {
    logger.error(`Error clearing entity cache: ${error.message}`, { entity, id });
  }
};

/**
 * Multi-get from cache
 * @param {Array<string>} keys Array of cache keys
 * @returns {Promise<Array<any>>} Array of cached values
 */
exports.mget = async (keys) => {
  try {
    const values = await redis.mget(keys);
    return values.map(value => value ? JSON.parse(value) : null);
  } catch (error) {
    logger.error(`Error getting multiple items from cache: ${error.message}`, { keys });
    return keys.map(() => null);
  }
};

/**
 * Get TTL for a cached key
 * @param {string} key Cache key
 * @returns {Promise<number>} TTL in seconds or -1 if key doesn't exist
 */
exports.getTTL = async (key) => {
  try {
    return await redis.ttl(key);
  } catch (error) {
    logger.error(`Error getting TTL for key: ${error.message}`, { key });
    return -1;
  }
}; 