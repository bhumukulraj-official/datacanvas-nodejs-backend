const Redis = require('ioredis');
const config = require('./index');
const logger = require('../utils/logger');

let redis;

try {
  // Create Redis client
  redis = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    keyPrefix: config.redis.keyPrefix,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    }
  });

  // Redis events
  redis.on('connect', () => {
    logger.info('Redis client connected');
  });

  redis.on('error', (err) => {
    logger.error(`Redis Error: ${err.message}`);
  });

  redis.on('reconnecting', () => {
    logger.info('Redis client reconnecting');
  });
} catch (error) {
  logger.error(`Redis initialization error: ${error.message}`);
  // Fallback to a dummy implementation if Redis is not available
  redis = {
    get: async () => null,
    set: async () => null,
    del: async () => null,
    keys: async () => [],
  };
}

module.exports = redis; 