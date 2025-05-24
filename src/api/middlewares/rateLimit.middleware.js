const rateLimit = require('express-rate-limit');
const { redis } = require('../../config');
const { rateLimit: rateLimitConfig } = require('../../config/security');
const { CustomError } = require('../../utils/error.util');

// Correct import for RedisStore
const RedisStore = require('rate-limit-redis').default;

const redisStore = new RedisStore({
  sendCommand: (...args) => {
    console.log('Redis command:', args);
    return redis.client.sendCommand(args);
  },
  prefix: 'rl:'
});

console.log('RedisStore initialized:', redisStore);

const apiLimiter = rateLimit({
  windowMs: rateLimitConfig.windowMs,
  max: rateLimitConfig.max,
  standardHeaders: true,
  legacyHeaders: false,
  store: redisStore,
  handler: (req, res, next) => {
    throw new CustomError('Too many requests', 429, 'RATE_LIMIT_EXCEEDED');
  }
});

module.exports = apiLimiter; 