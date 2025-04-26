/**
 * Export system routes
 */
const {
  backupRoutes,
  auditRoutes,
  configRoutes,
  cacheRoutes,
  logRoutes,
  monitoringRoutes,
  healthRoutes
} = require('./routes');

module.exports = {
  backupRoutes,
  auditRoutes,
  configRoutes,
  cacheRoutes,
  logRoutes,
  monitoringRoutes,
  healthRoutes
}; 