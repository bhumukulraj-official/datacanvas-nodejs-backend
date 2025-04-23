const Setting = require('../models/Setting');
const { NotFoundError } = require('../../../shared/errors');
const logger = require('../../../shared/utils/logger');
const cache = require('../../../shared/utils/cache');

// Cache key for settings
const SETTINGS_CACHE_KEY = 'site:settings';
// Cache TTL in seconds (1 hour)
const CACHE_TTL = 3600;

/**
 * Default settings to use when creating new settings or resetting
 */
const DEFAULT_SETTINGS = {
  site_name: 'DataCanvas',
  site_description: 'A platform for data visualization and analysis',
  theme: {
    primary_color: '#3498db',
    secondary_color: '#2ecc71',
    font_family: 'Roboto, sans-serif',
    dark_mode: false
  },
  contact_info: {
    email: 'contact@example.com',
    phone: '+1 123 456 7890',
    address: '123 Main St, City, Country'
  },
  social_links: {
    facebook: 'https://facebook.com/datacanvas',
    twitter: 'https://twitter.com/datacanvas',
    instagram: 'https://instagram.com/datacanvas',
    linkedin: 'https://linkedin.com/company/datacanvas'
  },
  seo_settings: {
    meta_title: 'DataCanvas - Data Visualization Platform',
    meta_description: 'Powerful data visualization and analysis platform',
    meta_keywords: 'data, visualization, analytics, charts, graphs',
    og_image: 'https://example.com/images/og-image.jpg'
  },
  analytics_settings: {
    google_analytics_id: '',
    enable_analytics: false
  },
  privacy_settings: {
    cookie_consent_required: true,
    cookie_consent_message: 'We use cookies to enhance your experience.',
    privacy_policy_url: '/privacy-policy'
  },
  security_settings: {
    enable_rate_limiting: true,
    max_login_attempts: 5,
    lockout_duration_minutes: 30,
    enable_two_factor_auth: false
  },
  notification_settings: {
    enable_email_notifications: true,
    enable_push_notifications: false
  },
  caching_settings: {
    enable_page_caching: true,
    cache_duration_seconds: 3600
  }
};

/**
 * Get all settings
 * @returns {Promise<Object>} Settings object
 */
const getSettings = async () => {
  try {
    // Try to get from cache first
    const cachedSettings = await cache.get(SETTINGS_CACHE_KEY);
    if (cachedSettings) {
      return JSON.parse(cachedSettings);
    }

    // If not in cache, get from database
    let settings = await Setting.findOne({ where: { id: 1 } });
    
    // If no settings found, create with defaults
    if (!settings) {
      settings = await Setting.create({
        ...DEFAULT_SETTINGS,
        id: 1 // Ensure ID is 1
      });
      logger.info('Created default settings');
    }

    // Store in cache for future requests
    await cache.set(SETTINGS_CACHE_KEY, JSON.stringify(settings), CACHE_TTL);
    
    return settings;
  } catch (error) {
    logger.error(`Error getting settings: ${error.message}`);
    throw error;
  }
};

/**
 * Get settings by key
 * @param {String} key - Settings key (e.g., 'theme', 'social_links')
 * @returns {Promise<Object>} Settings value for the key
 */
const getSettingsByKey = async (key) => {
  try {
    const settings = await getSettings();
    
    if (!settings[key] && settings[key] !== false && settings[key] !== 0) {
      throw new NotFoundError(`Settings for '${key}' not found`);
    }
    
    return { [key]: settings[key] };
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    logger.error(`Error getting settings by key ${key}: ${error.message}`);
    throw error;
  }
};

/**
 * Update settings
 * @param {Object} settingsData - New settings data
 * @returns {Promise<Object>} Updated settings
 */
const updateSettings = async (settingsData) => {
  try {
    let settings = await Setting.findOne({ where: { id: 1 } });
    
    // If settings don't exist, create them
    if (!settings) {
      settings = await Setting.create({
        ...DEFAULT_SETTINGS,
        ...settingsData,
        id: 1
      });
    } else {
      // Update existing settings
      await settings.update(settingsData);
    }
    
    // Invalidate cache
    await cache.del(SETTINGS_CACHE_KEY);
    
    logger.info('Settings updated');
    
    return settings;
  } catch (error) {
    logger.error(`Error updating settings: ${error.message}`);
    throw error;
  }
};

/**
 * Update settings by key
 * @param {String} key - Settings key to update
 * @param {Object} data - New value for the key
 * @returns {Promise<Object>} Updated settings
 */
const updateSettingsByKey = async (key, data) => {
  try {
    // Check if the key exists in settings
    const settings = await getSettings();
    
    if (key !== 'site_name' && key !== 'site_description' && 
        !settings[key] && settings[key] !== false && settings[key] !== 0) {
      throw new NotFoundError(`Settings for '${key}' not found`);
    }
    
    // Update only the specified key
    const updateData = { [key]: data };
    
    return await updateSettings(updateData);
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    logger.error(`Error updating settings by key ${key}: ${error.message}`);
    throw error;
  }
};

/**
 * Reset settings to default values
 * @returns {Promise<Object>} Reset settings
 */
const resetSettings = async () => {
  try {
    let settings = await Setting.findOne({ where: { id: 1 } });
    
    if (!settings) {
      settings = await Setting.create({
        ...DEFAULT_SETTINGS,
        id: 1
      });
    } else {
      await settings.update(DEFAULT_SETTINGS);
    }
    
    // Invalidate cache
    await cache.del(SETTINGS_CACHE_KEY);
    
    logger.info('Settings reset to defaults');
    
    return settings;
  } catch (error) {
    logger.error(`Error resetting settings: ${error.message}`);
    throw error;
  }
};

module.exports = {
  getSettings,
  getSettingsByKey,
  updateSettings,
  updateSettingsByKey,
  resetSettings
}; 