/**
 * Settings Controller
 * Handles HTTP requests for settings-related operations
 */
const { settingService } = require('../services');
const { catchAsync } = require('../../../shared/utils');

/**
 * Get all settings (admin only)
 */
exports.getAllSettings = catchAsync(async (req, res) => {
  // This is an admin-only endpoint
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to access settings'
      }
    });
  }
  
  const settings = await settingService.getSettings();
  
  res.status(200).json({
    success: true,
    data: settings
  });
});

/**
 * Get public settings (accessible to everyone)
 */
exports.getPublicSettings = catchAsync(async (req, res) => {
  const settings = await settingService.getPublicSettings();
  
  res.status(200).json({
    success: true,
    data: settings
  });
});

/**
 * Update settings (admin only)
 */
exports.updateSettings = catchAsync(async (req, res) => {
  // This is an admin-only endpoint
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to update settings'
      }
    });
  }
  
  const settings = await settingService.updateSettings(req.body);
  
  res.status(200).json({
    success: true,
    data: settings
  });
});

/**
 * Get a single setting by key
 */
exports.getSetting = catchAsync(async (req, res) => {
  const { key } = req.params;
  
  // For sensitive settings, restrict to admin only
  const sensitiveSettings = [
    'seo_settings',
    'analytics_settings',
    'privacy_settings',
    'notification_settings',
    'caching_settings',
    'security_settings'
  ];
  
  if (sensitiveSettings.includes(key) && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this setting'
      }
    });
  }
  
  const setting = await settingService.getSetting(key);
  
  res.status(200).json({
    success: true,
    data: setting
  });
});

/**
 * Update a single setting by key (admin only)
 */
exports.updateSetting = catchAsync(async (req, res) => {
  // This is an admin-only endpoint
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to update settings'
      }
    });
  }
  
  const { key } = req.params;
  const { value } = req.body;
  
  const settings = await settingService.updateSetting(key, value);
  
  res.status(200).json({
    success: true,
    data: { [key]: settings[key] }
  });
}); 