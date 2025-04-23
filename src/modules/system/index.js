/**
 * System module
 * Provides system-level functionality like backup/restore and audit logging
 */
const { backupRoutes, auditRoutes } = require('./routes');
const backupService = require('./services/backup.service');
const auditService = require('./services/audit.service');

module.exports = {
  backupRoutes,
  auditRoutes,
  backupService,
  auditService
}; 