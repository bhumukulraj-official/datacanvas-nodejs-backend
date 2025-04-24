/**
 * Configuration Controller
 * Handles system configuration API endpoints
 */
const configService = require('../services/config.service');
const catchAsync = require('../../../shared/utils/catchAsync');
const AppError = require('../../../shared/errors/appError');

/**
 * Get complete system configuration
 * @route GET /api/v1/admin/system/config
 */
exports.getConfig = catchAsync(async (req, res) => {
  const config = await configService.getConfig();
  
  res.status(200).json({
    success: true,
    message: 'System configuration retrieved successfully',
    data: config
  });
});

/**
 * Get configuration for a specific section
 * @route GET /api/v1/admin/system/config/:section
 */
exports.getConfigSection = catchAsync(async (req, res) => {
  const { section } = req.params;
  
  const sectionConfig = await configService.getConfigSection(section);
  
  res.status(200).json({
    success: true,
    message: `System configuration section '${section}' retrieved successfully`,
    data: sectionConfig
  });
});

/**
 * Update complete system configuration
 * @route PUT /api/v1/admin/system/config
 */
exports.updateConfig = catchAsync(async (req, res) => {
  const { config } = req.body;
  
  const updatedConfig = await configService.updateConfig(config);
  
  res.status(200).json({
    success: true,
    message: 'System configuration updated successfully',
    data: updatedConfig
  });
});

/**
 * Update a specific configuration section
 * @route PUT /api/v1/admin/system/config/:section
 */
exports.updateConfigSection = catchAsync(async (req, res) => {
  const { section } = req.params;
  const sectionConfig = req.body;
  
  const updatedConfig = await configService.updateConfigSection(section, sectionConfig);
  
  res.status(200).json({
    success: true,
    message: `System configuration section '${section}' updated successfully`,
    data: updatedConfig
  });
});

/**
 * Update a specific configuration value
 * @route PATCH /api/v1/admin/system/config
 */
exports.updateConfigValue = catchAsync(async (req, res) => {
  const { path, value } = req.body;
  
  if (!path) {
    return res.status(400).json({
      success: false,
      message: 'Configuration path is required'
    });
  }
  
  const updatedConfig = await configService.updateConfigValue(path, value);
  
  res.status(200).json({
    success: true,
    message: `Configuration value at '${path}' updated successfully`,
    data: {
      path,
      value,
      config: updatedConfig
    }
  });
});

/**
 * Reset configuration to defaults
 * @route POST /api/v1/admin/system/config/reset
 */
exports.resetConfig = catchAsync(async (req, res) => {
  const defaultConfig = await configService.resetConfig();
  
  res.status(200).json({
    success: true,
    message: 'System configuration reset to defaults successfully',
    data: defaultConfig
  });
});

/**
 * Toggle maintenance mode
 * @route POST /api/v1/admin/system/maintenance
 */
exports.toggleMaintenanceMode = catchAsync(async (req, res) => {
  const { enabled, message, allowAdminAccess } = req.body;
  
  let config;
  
  if (enabled) {
    config = await configService.enableMaintenanceMode(message, allowAdminAccess);
    
    res.status(200).json({
      success: true,
      message: 'Maintenance mode enabled successfully',
      data: {
        maintenance: config.system.maintenance
      }
    });
  } else {
    config = await configService.disableMaintenanceMode();
    
    res.status(200).json({
      success: true,
      message: 'Maintenance mode disabled successfully',
      data: {
        maintenance: config.system.maintenance
      }
    });
  }
});

/**
 * Set logging level
 * @route POST /api/v1/admin/system/logging/level
 */
exports.setLoggingLevel = catchAsync(async (req, res) => {
  const { level } = req.body;
  
  if (!level) {
    return res.status(400).json({
      success: false,
      message: 'Logging level is required'
    });
  }
  
  try {
    const config = await configService.setLoggingLevel(level);
    
    res.status(200).json({
      success: true,
      message: `Logging level set to '${level}' successfully`,
      data: {
        logging: config.system.logging
      }
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get all configurations
exports.getAllConfigurations = catchAsync(async (req, res) => {
  const { prefix } = req.query;
  const configs = await configService.getAll(prefix);
  
  res.status(200).json({
    status: 'success',
    results: configs.length,
    data: {
      configurations: configs
    }
  });
});

// Get configuration by key
exports.getConfiguration = catchAsync(async (req, res, next) => {
  const { key } = req.params;
  
  // Get configuration with null as default value (will return null if not found)
  const value = await configService.get(key, null);
  
  if (value === null) {
    return next(new AppError(`Configuration '${key}' not found`, 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      key,
      value
    }
  });
});

// Create or update configuration
exports.updateConfiguration = catchAsync(async (req, res) => {
  const { key } = req.params;
  const { value, type, description } = req.body;
  
  if (value === undefined) {
    throw new AppError('Configuration value is required', 400);
  }
  
  const success = await configService.set(key, value, type, description);
  
  if (!success) {
    throw new AppError('Failed to update configuration', 500);
  }
  
  // Get the updated value to return in response
  const updatedValue = await configService.get(key);
  
  res.status(200).json({
    status: 'success',
    data: {
      key,
      value: updatedValue,
      type
    }
  });
});

// Delete configuration
exports.deleteConfiguration = catchAsync(async (req, res) => {
  const { key } = req.params;
  
  const success = await configService.delete(key);
  
  if (!success) {
    throw new AppError('Failed to delete configuration', 500);
  }
  
  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Refresh configuration cache
exports.refreshCache = catchAsync(async (req, res) => {
  const success = await configService.refreshCache();
  
  if (!success) {
    throw new AppError('Failed to refresh configuration cache', 500);
  }
  
  res.status(200).json({
    status: 'success',
    message: 'Configuration cache refreshed successfully'
  });
});

// Get maintenance mode status
exports.getMaintenanceStatus = catchAsync(async (req, res) => {
  const isMaintenanceMode = await configService.isMaintenanceMode();
  const message = await configService.getMaintenanceMessage();
  const allowAdminAccess = await configService.allowAdminDuringMaintenance();
  
  res.status(200).json({
    status: 'success',
    data: {
      maintenanceMode: isMaintenanceMode,
      message,
      allowAdminAccess
    }
  });
});

// Enable maintenance mode
exports.enableMaintenanceMode = catchAsync(async (req, res) => {
  const { message, allowAdminAccess } = req.body;
  
  // Update maintenance settings
  await configService.set('system.maintenance_mode', true, 'boolean');
  
  if (message) {
    await configService.set('system.maintenance_message', message, 'string');
  }
  
  if (allowAdminAccess !== undefined) {
    await configService.set('system.allow_admin_during_maintenance', allowAdminAccess, 'boolean');
  }
  
  res.status(200).json({
    status: 'success',
    message: 'Maintenance mode enabled',
    data: {
      maintenanceMode: true,
      message: await configService.getMaintenanceMessage(),
      allowAdminAccess: await configService.allowAdminDuringMaintenance()
    }
  });
});

// Disable maintenance mode
exports.disableMaintenanceMode = catchAsync(async (req, res) => {
  // Disable maintenance mode
  await configService.set('system.maintenance_mode', false, 'boolean');
  
  res.status(200).json({
    status: 'success',
    message: 'Maintenance mode disabled',
    data: {
      maintenanceMode: false
    }
  });
}); 