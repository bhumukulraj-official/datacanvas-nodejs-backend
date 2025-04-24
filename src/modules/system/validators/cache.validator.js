/**
 * Cache validators
 * Validates request parameters for cache routes
 */
const Joi = require('joi');

// Define valid cache namespaces
const VALID_NAMESPACES = ['api', 'db', 'auth', 'media', 'search', 'config'];

exports.clearNamespaceCache = {
  params: Joi.object().keys({
    namespace: Joi.string().required().valid(...VALID_NAMESPACES)
  })
};

exports.getCacheItem = {
  query: Joi.object().keys({
    key: Joi.string().required().min(1).max(255),
    namespace: Joi.string().valid(...VALID_NAMESPACES).default('api')
  })
};

exports.deleteCacheItem = {
  query: Joi.object().keys({
    key: Joi.string().required().min(1).max(255),
    namespace: Joi.string().valid(...VALID_NAMESPACES).default('api')
  })
}; 