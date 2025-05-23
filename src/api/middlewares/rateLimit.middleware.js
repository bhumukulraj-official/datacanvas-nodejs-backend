const rateLimit = require('express-rate-limit');
const { redis } = require('../../config');
const { rateLimit: rateLimitConfig } = require('../../config/security');
const { CustomError } = require('../../utils/error.util');

const redisStore = {
  init: rateLimitConfig,
  get: async (key) => {
    const count = await redis.get(key);
    return count ? parseInt(count) : 0;
  },
  increment: (key) => redis.incr(key),
  decrement: (key) => redis.decr(key),
  resetKey: (key) => redis.del(key)
};

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