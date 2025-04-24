const express = require('express');
const apiKeyController = require('./controllers/unified-api-key.controller');
const auditController = require('./controllers/audit.controller');
const auth = require('../../shared/middleware/auth.middleware');
const validate = require('../../shared/middleware/validate.middleware');
const { apiKeyValidator, auditLogValidator } = require('./validators');

const router = express.Router();

/**
 * API Key routes - Admin only
 */
router.get('/api-keys', 
  auth.requireAuth, 
  auth.requireRole('admin'), 
  apiKeyController.listApiKeys
);

router.get('/api-keys/:id', 
  auth.requireAuth, 
  auth.requireRole('admin'), 
  validate(apiKeyValidator.getApiKey), 
  apiKeyController.getApiKey
);

router.post('/api-keys', 
  auth.requireAuth, 
  auth.requireRole('admin'), 
  validate(apiKeyValidator.createApiKey), 
  apiKeyController.createApiKey
);

router.put('/api-keys/:id', 
  auth.requireAuth, 
  auth.requireRole('admin'), 
  validate(apiKeyValidator.updateApiKey), 
  apiKeyController.updateApiKey
);

router.patch('/api-keys/:id/revoke', 
  auth.requireAuth, 
  auth.requireRole('admin'), 
  validate(apiKeyValidator.revokeApiKey), 
  apiKeyController.revokeApiKey
);

router.delete('/api-keys/:id', 
  auth.requireAuth, 
  auth.requireRole('admin'), 
  validate(apiKeyValidator.deleteApiKey), 
  apiKeyController.deleteApiKey
);

/**
 * New API Key analytics and metadata routes
 */
router.get('/api-keys/stats/usage', 
  auth.requireAuth, 
  auth.requireRole('admin'), 
  apiKeyController.getApiKeyUsageStats
);

router.get('/api-keys/permissions', 
  auth.requireAuth, 
  auth.requireRole('admin'), 
  apiKeyController.getApiKeyPermissions
);

/**
 * Audit Log routes
 */
router.get('/audit-logs',
  auth.requireAuth,
  auth.requireRole('admin'),
  validate(auditLogValidator.getAuditLogs),
  auditController.getAuditLogs
);

router.get('/audit-logs/:id',
  auth.requireAuth,
  auth.requireRole('admin'),
  validate(auditLogValidator.getAuditLogById),
  auditController.getAuditLogById
);

module.exports = router; 