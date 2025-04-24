/**
 * Cache Service
 * Manages application caches and provides cache control functionality
 */
const redis = require('../../../config/redis');
const logger = require('../../../shared/utils/logger');
const NodeCache = require('node-cache');

// In-memory cache for fallback when Redis is not available
const memoryCache = new NodeCache({ 
  stdTTL: 300, // 5 minutes
  checkperiod: 60, // Check for expired keys every minute
  useClones: false // Don't clone objects when getting/setting
});

// Tracking for different cache namespaces
const CACHE_NAMESPACES = [
  'api', // API response cache
  'db', // Database query cache
  'auth', // Authentication related cache
  'media', // Media processing cache
  'search', // Search results cache
  'config', // Configuration cache
];

/**
 * Set a cache item
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in seconds
 * @param {string} namespace - Cache namespace
 * @returns {boolean} Success status
 */
exports.set = async (key, value, ttl = 300, namespace = 'api') => {
  try {
    const namespacedKey = `${namespace}:${key}`;
    
    if (redis) {
      // Use Redis if available
      if (typeof value === 'object') {
        value = JSON.stringify(value);
      }
      
      await redis.set(namespacedKey, value, 'EX', ttl);
    } else {
      // Fallback to in-memory cache
      memoryCache.set(namespacedKey, value, ttl);
    }
    
    return true;
  } catch (error) {
    logger.error(`Cache set error: ${error.message}`);
    return false;
  }
};

/**
 * Get a cache item
 * @param {string} key - Cache key
 * @param {string} namespace - Cache namespace
 * @returns {any} Cached value or null
 */
exports.get = async (key, namespace = 'api') => {
  try {
    const namespacedKey = `${namespace}:${key}`;
    
    if (redis) {
      // Use Redis if available
      const value = await redis.get(namespacedKey);
      
      if (!value) {
        return null;
      }
      
      // Try to parse as JSON, if it fails, return as is
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    } else {
      // Fallback to in-memory cache
      return memoryCache.get(namespacedKey);
    }
  } catch (error) {
    logger.error(`Cache get error: ${error.message}`);
    return null;
  }
};

/**
 * Delete a cache item
 * @param {string} key - Cache key
 * @param {string} namespace - Cache namespace
 * @returns {boolean} Success status
 */
exports.del = async (key, namespace = 'api') => {
  try {
    const namespacedKey = `${namespace}:${key}`;
    
    if (redis) {
      // Use Redis if available
      await redis.del(namespacedKey);
    } else {
      // Fallback to in-memory cache
      memoryCache.del(namespacedKey);
    }
    
    return true;
  } catch (error) {
    logger.error(`Cache delete error: ${error.message}`);
    return false;
  }
};

/**
 * Clear all cache items in a namespace
 * @param {string} namespace - Cache namespace
 * @returns {boolean} Success status
 */
exports.clearNamespace = async (namespace) => {
  try {
    if (!CACHE_NAMESPACES.includes(namespace)) {
      throw new Error(`Invalid cache namespace: ${namespace}`);
    }
    
    if (redis) {
      // Use Redis if available
      // Get all keys in namespace
      const keys = await redis.keys(`${namespace}:*`);
      
      if (keys.length > 0) {
        // Delete all keys in one operation
        await redis.del(...keys);
      }
    } else {
      // Fallback to in-memory cache
      const allKeys = memoryCache.keys();
      const namespaceKeys = allKeys.filter(key => key.startsWith(`${namespace}:`));
      
      if (namespaceKeys.length > 0) {
        memoryCache.del(namespaceKeys);
      }
    }
    
    logger.info(`Cleared cache namespace: ${namespace}`);
    return true;
  } catch (error) {
    logger.error(`Cache namespace clear error: ${error.message}`);
    return false;
  }
};

/**
 * Clear all cache items
 * @returns {boolean} Success status
 */
exports.clearAll = async () => {
  try {
    if (redis) {
      // Use Redis if available
      // Flush all keys
      await redis.flushall();
    } else {
      // Fallback to in-memory cache
      memoryCache.flushAll();
    }
    
    logger.info('Cleared all cache items');
    return true;
  } catch (error) {
    logger.error(`Cache clear all error: ${error.message}`);
    return false;
  }
};

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
exports.getStats = async () => {
  try {
    const stats = {
      provider: redis ? 'redis' : 'memory',
      namespaces: {},
      total: {
        keys: 0,
        size: 0
      }
    };
    
    if (redis) {
      // Get Redis stats
      const info = await redis.info();
      const memory = info.match(/used_memory_human:([^\r\n]+)/);
      const keyspace = info.match(/db0:keys=(\d+)/);
      
      stats.total.keys = keyspace ? parseInt(keyspace[1]) : 0;
      stats.total.size = memory ? memory[1] : 'unknown';
      
      // Get keys count for each namespace
      for (const namespace of CACHE_NAMESPACES) {
        const keys = await redis.keys(`${namespace}:*`);
        stats.namespaces[namespace] = {
          keys: keys.length
        };
      }
    } else {
      // Get memory cache stats
      const memStats = memoryCache.getStats();
      stats.total.keys = memStats.keys;
      stats.total.size = formatBytes(memStats.vsize);
      
      // Get keys count for each namespace
      const allKeys = memoryCache.keys();
      for (const namespace of CACHE_NAMESPACES) {
        const keys = allKeys.filter(key => key.startsWith(`${namespace}:`));
        stats.namespaces[namespace] = {
          keys: keys.length
        };
      }
    }
    
    return stats;
  } catch (error) {
    logger.error(`Cache stats error: ${error.message}`);
    return {
      error: error.message,
      provider: redis ? 'redis' : 'memory'
    };
  }
};

/**
 * Create a cache middleware for Express
 * @param {number} ttl - Time to live in seconds
 * @param {Function} keyGenerator - Function to generate cache key from request
 * @returns {Function} Express middleware
 */
exports.cacheMiddleware = (ttl = 300, keyGenerator = null) => {
  return async (req, res, next) => {
    // Skip caching for non-GET requests or if cache is disabled
    if (req.method !== 'GET') {
      return next();
    }
    
    // Generate cache key
    const cacheKey = keyGenerator 
      ? keyGenerator(req)
      : `${req.originalUrl || req.url}`;
    
    try {
      // Try to get from cache
      const cachedResponse = await exports.get(cacheKey);
      
      if (cachedResponse) {
        // Send cached response
        return res.json(cachedResponse);
      }
      
      // Store original json method
      const originalJson = res.json;
      
      // Override json method to cache response
      res.json = function(data) {
        // Cache response data
        exports.set(cacheKey, data, ttl);
        
        // Call original json method
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      logger.error(`Cache middleware error: ${error.message}`);
      next();
    }
  };
};

/**
 * Format bytes to human-readable format
 * @param {number} bytes - Bytes to format
 * @returns {string} Formatted string
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}; 