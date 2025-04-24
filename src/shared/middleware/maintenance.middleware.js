/**
 * Maintenance middleware
 * 
 * This middleware checks if the application is in maintenance mode
 * and blocks requests if it is, except for admin users or specific endpoints.
 */
const configService = require('../../modules/system/services/config.service');

/**
 * Check if the application is in maintenance mode and block non-admin requests
 * @returns {Function} Express middleware
 */
exports.maintenanceCheck = async (req, res, next) => {
  try {
    // Skip check for health endpoints to allow monitoring
    if (req.path === '/api/v1/health' || req.path === '/api/v1/health/detailed') {
      return next();
    }

    // Check if maintenance mode is enabled
    const maintenanceEnabled = await configService.getConfigValue('system.maintenance.enabled', false);
    
    if (!maintenanceEnabled) {
      return next();
    }
    
    const maintenanceConfig = await configService.getConfigSection('system.maintenance');
    const message = maintenanceConfig.message || 'System is under maintenance. Please try again later.';
    
    // Allow admin users to access the system in maintenance mode if configured
    if (maintenanceConfig.allowAdminAccess && req.user && req.user.role === 'admin') {
      return next();
    }
    
    // Block normal requests with maintenance message
    return res.status(503).json({
      success: false,
      error: {
        code: 'MAINTENANCE',
        message
      }
    });
  } catch (error) {
    // In case of error reading config, allow request to continue
    console.error('Error checking maintenance mode:', error);
    return next();
  }
}; 