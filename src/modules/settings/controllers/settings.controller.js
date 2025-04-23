/**
 * Settings Controller
 * Unified controller that handles all settings-related HTTP requests
 */
const settingsService = require('../services/settings.service');
const { NotFoundError, ValidationError } = require('../../../shared/errors');
const { catchAsync } = require('../../../shared/utils');

/**
 * Get all settings (admin only)
 */
exports.getAllSettings = catchAsync(async (req, res) => {
  // Check if user is admin
  if (req.user && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to access all settings'
      }
    });
  }

  const settings = await settingsService.getSettings();
  
  return res.status(200).json({
    success: true,
    data: settings,
    message: 'Settings retrieved successfully',
    timestamp: new Date().toISOString()
  });
});

/**
 * Get public settings (accessible to anyone)
 */
exports.getPublicSettings = catchAsync(async (req, res) => {
  const settings = await settingsService.getPublicSettings();
  
  return res.status(200).json({
    success: true,
    data: settings,
    message: 'Public settings retrieved successfully',
    timestamp: new Date().toISOString()
  });
});

/**
 * Get settings by key
 */
exports.getSettingsByKey = catchAsync(async (req, res) => {
  const { key } = req.params;
  
  if (!key) {
    throw new ValidationError('Settings key is required');
  }

  // List of sensitive settings that should be restricted to admins
  const sensitiveSettings = [
    'seo_settings',
    'analytics_settings',
    'security_settings',
    'privacy_settings',
    'notification_settings',
    'caching_settings'
  ];

  // Check if user has permission to access this setting
  if (sensitiveSettings.includes(key) && (!req.user || req.user.role !== 'admin')) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this setting'
      }
    });
  }
  
  try {
    const settings = await settingsService.getSettingsByKey(key);
    
    return res.status(200).json({
      success: true,
      data: settings,
      message: `${key} settings retrieved successfully`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        error: {
          message: error.message,
          code: 'SETTINGS_NOT_FOUND'
        },
        timestamp: new Date().toISOString()
      });
    }
    throw error;
  }
});

/**
 * Update all settings (admin only)
 */
exports.updateSettings = catchAsync(async (req, res) => {
  // Check if user is admin
  if (req.user && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to update settings'
      }
    });
  }

  const settingsData = req.body;
  
  const updatedSettings = await settingsService.updateSettings(settingsData, {
    userId: req.user.id
  });
  
  return res.status(200).json({
    success: true,
    data: updatedSettings,
    message: 'Settings updated successfully',
    timestamp: new Date().toISOString()
  });
});

/**
 * Update settings by key (admin only)
 */
exports.updateSettingsByKey = catchAsync(async (req, res) => {
  // Check if user is admin
  if (req.user && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to update settings'
      }
    });
  }

  const { key } = req.params;
  const data = req.body.value !== undefined ? req.body.value : req.body;
  
  if (!key) {
    throw new ValidationError('Settings key is required');
  }
  
  try {
    const settings = await settingsService.updateSettingsByKey(key, data, {
      userId: req.user.id
    });
    
    return res.status(200).json({
      success: true,
      data: { [key]: settings[key] },
      message: `${key} settings updated successfully`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        error: {
          message: error.message,
          code: 'SETTINGS_NOT_FOUND'
        },
        timestamp: new Date().toISOString()
      });
    } else if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: {
          message: error.message,
          code: 'VALIDATION_ERROR'
        },
        timestamp: new Date().toISOString()
      });
    }
    throw error;
  }
});

/**
 * Reset settings to default (admin only)
 */
exports.resetSettings = catchAsync(async (req, res) => {
  // Check if user is admin
  if (req.user && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to reset settings'
      }
    });
  }

  const settings = await settingsService.resetSettings({
    userId: req.user.id
  });
  
  return res.status(200).json({
    success: true,
    data: settings,
    message: 'Settings reset to default values',
    timestamp: new Date().toISOString()
  });
});

/**
 * Export settings (admin only)
 */
exports.exportSettings = catchAsync(async (req, res) => {
  // Check if user is admin
  if (req.user && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to export settings'
      }
    });
  }

  const { format = 'json' } = req.query;
  
  try {
    const exportResult = await settingsService.exportSettings(format);
    
    // Set appropriate headers for the response
    res.setHeader('Content-Type', exportResult.contentType);
    res.setHeader('Content-Disposition', `attachment; filename=${exportResult.filename}`);
    
    if (exportResult.message) {
      return res.status(200).json({
        success: true,
        data: exportResult.data,
        message: exportResult.message,
        timestamp: new Date().toISOString()
      });
    }
    
    return res.status(200).json(exportResult.data);
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: {
          message: error.message,
          code: 'VALIDATION_ERROR'
        },
        timestamp: new Date().toISOString()
      });
    }
    throw error;
  }
});

/**
 * Import settings (admin only)
 */
exports.importSettings = catchAsync(async (req, res) => {
  // Check if user is admin
  if (req.user && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to import settings'
      }
    });
  }

  const settingsData = req.body;
  
  try {
    const settings = await settingsService.importSettings(settingsData, {
      userId: req.user.id
    });
    
    return res.status(200).json({
      success: true,
      data: settings,
      message: 'Settings imported successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: {
          message: error.message,
          code: 'VALIDATION_ERROR'
        },
        timestamp: new Date().toISOString()
      });
    }
    throw error;
  }
}); 