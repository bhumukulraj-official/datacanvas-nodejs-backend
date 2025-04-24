/**
 * System Routes Index
 * Exports all system module routes
 */
const backupRoutes = require('./backup.routes');
const auditRoutes = require('./audit.routes');
const configRoutes = require('./config.routes');
const cacheRoutes = require('./cache.routes');
const logRoutes = require('./log.routes');
const monitoringRoutes = require('./monitoring.routes');
const healthRoutes = require('./health.routes');

module.exports = {
  backupRoutes,
  auditRoutes,
  configRoutes,
  cacheRoutes,
  logRoutes,
  monitoringRoutes,
  healthRoutes
}; 