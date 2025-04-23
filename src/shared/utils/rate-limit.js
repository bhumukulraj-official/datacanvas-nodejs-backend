/**
 * Rate limiting utility
 * 
 * This is a simple in-memory rate limiter. In production, you would typically use Redis
 * or another distributed cache to make this work across multiple server instances.
 */

const logger = require('./logger');

// In-memory cache for rate limiting
const rateCache = new Map();

/**
 * Check if a key has exceeded its rate limit
 * @param {string} key - The unique key to check (usually IP address or user ID)
 * @param {number} limit - Maximum allowed requests
 * @param {number} duration - Time window in seconds
 * @returns {Promise<boolean>} - Whether the key has exceeded the rate limit
 */
exports.check = async (key, limit, duration) => {
  const now = Date.now();
  
  // Clean up expired entries periodically (simple garbage collection)
  if (Math.random() < 0.01) {
    this.cleanupExpired();
  }
  
  if (!rateCache.has(key)) {
    return false;
  }
  
  const entry = rateCache.get(key);
  
  // Check if the entry has expired
  if (entry.expiry < now) {
    rateCache.delete(key);
    return false;
  }
  
  // Check if the count exceeds the limit
  if (entry.count >= limit) {
    logger.warn('Rate limit exceeded', { key, limit, duration });
    return true;
  }
  
  return false;
};

/**
 * Increment the count for a key
 * @param {string} key - The unique key to increment
 * @param {number} duration - Time window in seconds
 * @returns {Promise<void>}
 */
exports.increment = async (key, duration) => {
  const now = Date.now();
  const expiry = now + (duration * 1000);
  
  if (!rateCache.has(key)) {
    rateCache.set(key, {
      count: 1,
      expiry
    });
    return;
  }
  
  const entry = rateCache.get(key);
  
  // If the entry has expired, reset it
  if (entry.expiry < now) {
    rateCache.set(key, {
      count: 1,
      expiry
    });
    return;
  }
  
  // Otherwise, increment the count
  entry.count += 1;
  rateCache.set(key, entry);
};

/**
 * Reset the count for a key
 * @param {string} key - The unique key to reset
 * @returns {Promise<void>}
 */
exports.reset = async (key) => {
  rateCache.delete(key);
};

/**
 * Clean up expired entries
 * @returns {Promise<void>}
 */
exports.cleanupExpired = async () => {
  const now = Date.now();
  
  // Remove expired entries
  for (const [key, entry] of rateCache.entries()) {
    if (entry.expiry < now) {
      rateCache.delete(key);
    }
  }
}; 