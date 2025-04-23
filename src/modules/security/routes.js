const express = require('express');
const apiKeyController = require('./controllers/api-key.controller');
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
 * Audit Log routes - Admin only
 */
router.get('/audit-logs', 
  auth.requireAuth, 
  auth.requireRole('admin'), 
  validate(auditLogValidator.listAuditLogs), 
  auditController.listAuditLogs
);

router.post('/audit-logs', 
  auth.requireAuth, 
  auth.requireRole('admin'), 
  validate(auditLogValidator.createAuditLog), 
  auditController.createAuditLog
);

router.get('/audit-logs/summary', 
  auth.requireAuth, 
  auth.requireRole('admin'), 
  validate(auditLogValidator.getSecuritySummary), 
  auditController.getSecuritySummary
);

module.exports = router; 