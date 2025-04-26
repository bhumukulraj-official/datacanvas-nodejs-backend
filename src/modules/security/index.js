'use strict';

/**
 * Export security module
 */
const routes = require('./routes');
const { ApiKey, ApiKeyUsage, AuditLog, RateLimit } = require('./models');

module.exports = {
  routes,
  ApiKeyModel: ApiKey,
  ApiKeyUsageModel: ApiKeyUsage,
  AuditLogModel: AuditLog,
  RateLimitModel: RateLimit
}; 