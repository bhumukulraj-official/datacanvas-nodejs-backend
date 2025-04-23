/**
 * Audit routes
 */
const express = require('express');
const auditController = require('../controllers/audit.controller');
const auditValidator = require('../validators/audit.validator');
const auth = require('../../../shared/middleware/auth.middleware');
const validate = require('../../../shared/middleware/validate.middleware');

const router = express.Router();

// All audit routes require admin role
router.use(auth.requireAuth);
router.use(auth.requireRole('admin'));

// Get all audit logs with filtering and pagination
router.get(
  '/',
  validate(auditValidator.getAuditLogs),
  auditController.getAuditLogs
);

// Get audit log by ID
router.get(
  '/:id',
  validate(auditValidator.getAuditLogById),
  auditController.getAuditLogById
);

// Create a manual audit log entry
router.post(
  '/',
  validate(auditValidator.createAuditLog),
  auditController.createAuditLog
);

// Get audit summary statistics
router.get(
  '/summary',
  auditController.getAuditSummary
);

module.exports = router; 