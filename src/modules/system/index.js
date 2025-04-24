/**
 * System Module - Provides system management features
 * - Backup and restoration
 * - Audit logging
 * - Configuration management
 * - Cache management  
 * - Log management
 * - Monitoring
 * - Health checks
 */
const routes = require('./routes');
const backup = require('./services/backup.service');
const audit = require('./services/audit.service');
const config = require('./services/config.service');
const cache = require('./services/cache.service');
const log = require('./services/log.service');
const health = require('./services/health.service');
const monitoring = require('./services/monitoring.service');

// Initialize services that need startup configuration
const init = async () => {
  try {
    // Initialize monitoring service
    await monitoring.init();
    
    // Initialize configuration service
    await config.init();
    
    console.log('System module initialized successfully');
  } catch (error) {
    console.error('Error initializing system module:', error);
  }
};

// Initialize system module on import
init();

module.exports = {
  routes,
  services: {
    backup,
    audit,
    config,
    cache,
    log,
    health,
    monitoring
  }
}; 