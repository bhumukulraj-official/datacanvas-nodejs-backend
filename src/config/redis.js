require('dotenv').config();
const Redis = require('ioredis');

/**
 * Redis connection configuration
 */
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || '',
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  db: process.env.REDIS_DB || 0,
};

const redisClient = new Redis(redisConfig);

// Handle connection events
redisClient.on('connect', () => {
  console.log('Redis client connected');
});

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err);
});

module.exports = {
  client: redisClient,
  config: redisConfig,
  getClient: () => redisClient,
  
  // Helper functions
  set: async (key, value, expiry = null) => {
    if (expiry) {
      return await redisClient.set(key, typeof value === 'object' ? JSON.stringify(value) : value, 'EX', expiry);
    }
    return await redisClient.set(key, typeof value === 'object' ? JSON.stringify(value) : value);
  },
  
  get: async (key) => {
    const value = await redisClient.get(key);
    try {
      return JSON.parse(value);
    } catch (e) {
      return value;
    }
  },
  
  del: async (key) => {
    return await redisClient.del(key);
  },
  
  flushDb: async () => {
    return await redisClient.flushdb();
  }
}; 