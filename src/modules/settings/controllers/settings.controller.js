const settingsService = require('../services/settings.service');
const { NotFoundError, ValidationError } = require('../../../shared/errors');

/**
 * Get all settings
 */
exports.getSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.getSettings();
    
    return res.status(200).json({
      success: true,
      data: settings,
      message: 'Settings retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get settings by key
 */
exports.getSettingsByKey = async (req, res, next) => {
  try {
    const { key } = req.params;
    
    if (!key) {
      throw new ValidationError('Settings key is required');
    }

    // Convert snake_case to camelCase if needed
    const settingsKey = key.includes('_') ? key : key.replace(/([A-Z])/g, '_$1').toLowerCase();
    
    const settings = await settingsService.getSettingsByKey(settingsKey);
    
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
          code: 'SETTINGS_001'
        },
        timestamp: new Date().toISOString()
      });
    }
    next(error);
  }
};

/**
 * Update settings
 * Admin only
 */
exports.updateSettings = async (req, res, next) => {
  try {
    const settingsData = req.body;
    
    const updatedSettings = await settingsService.updateSettings(settingsData);
    
    return res.status(200).json({
      success: true,
      data: updatedSettings,
      message: 'Settings updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update settings by key
 * Admin only
 */
exports.updateSettingsByKey = async (req, res, next) => {
  try {
    const { key } = req.params;
    const data = req.body;
    
    if (!key) {
      throw new ValidationError('Settings key is required');
    }

    // Convert snake_case to camelCase if needed
    const settingsKey = key.includes('_') ? key : key.replace(/([A-Z])/g, '_$1').toLowerCase();
    
    const settings = await settingsService.updateSettingsByKey(settingsKey, data);
    
    return res.status(200).json({
      success: true,
      data: settings,
      message: `${key} settings updated successfully`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        error: {
          message: error.message,
          code: 'SETTINGS_001'
        },
        timestamp: new Date().toISOString()
      });
    }
    next(error);
  }
};

/**
 * Reset settings to default
 * Admin only
 */
exports.resetSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.resetSettings();
    
    return res.status(200).json({
      success: true,
      data: settings,
      message: 'Settings reset to default values',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
}; 