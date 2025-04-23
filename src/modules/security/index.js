/**
 * Export security module
 */
const { apiKeyRoutes } = require('./routes');
const { ApiKey, ApiKeyUsage, AuditLog, RateLimit } = require('./models');

module.exports = {
  apiKeyRoutes,
  ApiKeyModel: ApiKey,
  ApiKeyUsageModel: ApiKeyUsage,
  AuditLogModel: AuditLog,
  RateLimitModel: RateLimit
}; 