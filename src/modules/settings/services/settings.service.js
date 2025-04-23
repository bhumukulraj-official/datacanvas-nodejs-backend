/**
 * Settings Service
 * Unified service that handles all settings operations
 */
const Setting = require('../models/Setting');
const { NotFoundError, ValidationError } = require('../../../shared/errors');
const logger = require('../../../shared/utils/logger');
const { redis } = require('../../../shared/cache');
const { isObject } = require('../../../shared/utils/validation');
const Joi = require('joi');

// Cache keys and TTL
const SETTINGS_CACHE_KEY_PREFIX = 'settings';
const SETTINGS_CACHE_KEY_ALL = `${SETTINGS_CACHE_KEY_PREFIX}:all`;
const SETTINGS_CACHE_KEY_PUBLIC = `${SETTINGS_CACHE_KEY_PREFIX}:public`;
const CACHE_TTL = 3600; // 1 hour in seconds

// JSON schema validators for complex fields
const themeSchema = Joi.object({
  primary_color: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
  secondary_color: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
  font_family: Joi.string().optional(),
  dark_mode: Joi.boolean().optional(),
  custom_css: Joi.string().optional()
});

const contactInfoSchema = Joi.object({
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
  address: Joi.string().optional(),
  business_hours: Joi.string().optional()
});

const socialLinksSchema = Joi.object().pattern(
  Joi.string(),
  Joi.string().uri()
);

const seoSettingsSchema = Joi.object({
  meta_title: Joi.string().optional(),
  meta_description: Joi.string().optional(),
  meta_keywords: Joi.string().optional(),
  og_image: Joi.string().uri().optional(),
  twitter_card: Joi.string().optional(),
  robots_txt: Joi.string().optional()
});

const analyticsSettingsSchema = Joi.object({
  google_analytics_id: Joi.string().optional(),
  enable_analytics: Joi.boolean().optional(),
  privacy_focused_mode: Joi.boolean().optional()
});

const securitySettingsSchema = Joi.object({
  enable_rate_limiting: Joi.boolean().optional(),
  max_login_attempts: Joi.number().integer().min(1).optional(),
  lockout_duration_minutes: Joi.number().integer().min(1).optional(),
  enable_two_factor_auth: Joi.boolean().optional(),
  password_expiry_days: Joi.number().integer().optional()
});

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
 * Validate a specific settings field against its schema
 * @param {string} key - The settings key to validate
 * @param {any} value - The value to validate
 * @throws {ValidationError} If validation fails
 */
const validateSettingsField = (key, value) => {
  // Skip validation for non-JSON fields
  if (!isObject(value)) return;
  
  let schema;
  switch (key) {
    case 'theme':
      schema = themeSchema;
      break;
    case 'contact_info':
      schema = contactInfoSchema;
      break;
    case 'social_links':
      schema = socialLinksSchema;
      break;
    case 'seo_settings':
      schema = seoSettingsSchema;
      break;
    case 'analytics_settings':
      schema = analyticsSettingsSchema;
      break;
    case 'security_settings':
      schema = securitySettingsSchema;
      break;
    default:
      // For other JSON fields that don't have specific schemas yet
      return;
  }
  
  const { error } = schema.validate(value);
  if (error) {
    throw new ValidationError(`Invalid ${key}: ${error.message}`);
  }
};

/**
 * Create a cache key for a specific settings field
 * @param {string} key - The settings field name
 * @returns {string} The cache key
 */
const getSettingsCacheKey = (key) => {
  return `${SETTINGS_CACHE_KEY_PREFIX}:${key}`;
};

/**
 * Get all settings
 * @returns {Promise<Object>} Settings object
 */
const getSettings = async () => {
  try {
    // Try to get from cache first
    const cachedSettings = await redis.get(SETTINGS_CACHE_KEY_ALL);
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
    const cacheDuration = settings.caching_settings?.cache_duration_seconds || CACHE_TTL;
    await redis.set(SETTINGS_CACHE_KEY_ALL, JSON.stringify(settings), 'EX', cacheDuration);
    
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
    // Try to get from cache first
    const cacheKey = getSettingsCacheKey(key);
    const cachedValue = await redis.get(cacheKey);
    
    if (cachedValue) {
      return { [key]: JSON.parse(cachedValue) };
    }
    
    const settings = await getSettings();
    
    if (!settings[key] && settings[key] !== false && settings[key] !== 0) {
      throw new NotFoundError(`Settings for '${key}' not found`);
    }
    
    // Cache this specific key
    const cacheDuration = settings.caching_settings?.cache_duration_seconds || CACHE_TTL;
    await redis.set(cacheKey, JSON.stringify(settings[key]), 'EX', cacheDuration);
    
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
 * @param {Object} options - Options including user information for audit
 * @returns {Promise<Object>} Updated settings
 */
const updateSettings = async (settingsData, options = {}) => {
  try {
    // Validate complex JSON fields
    Object.entries(settingsData).forEach(([key, value]) => {
      validateSettingsField(key, value);
    });
    
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
    
    // Log the change for audit
    if (options.userId) {
      logger.info(`Settings updated by user ${options.userId}`, {
        userId: options.userId,
        action: 'settings_update',
        changes: Object.keys(settingsData)
      });
    }
    
    // Invalidate all caches related to settings
    await invalidateSettingsCache(Object.keys(settingsData));
    
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
 * @param {Object} options - Options including user information for audit
 * @returns {Promise<Object>} Updated settings
 */
const updateSettingsByKey = async (key, data, options = {}) => {
  try {
    // Validate the data against schema if needed
    validateSettingsField(key, data);
    
    // Check if the key exists in settings
    const settings = await getSettings();
    
    if (key !== 'site_name' && key !== 'site_description' && 
        !settings[key] && settings[key] !== false && settings[key] !== 0) {
      throw new NotFoundError(`Settings for '${key}' not found`);
    }
    
    // Update only the specified key
    const updateData = { [key]: data };
    
    const updatedSettings = await updateSettings(updateData, options);
    
    return updatedSettings;
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
 * @param {Object} options - Options including user information for audit
 * @returns {Promise<Object>} Reset settings
 */
const resetSettings = async (options = {}) => {
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
    
    // Log the reset for audit
    if (options.userId) {
      logger.info(`Settings reset to defaults by user ${options.userId}`, {
        userId: options.userId,
        action: 'settings_reset'
      });
    }
    
    // Invalidate all caches
    await invalidateAllSettingsCache();
    
    return settings;
  } catch (error) {
    logger.error(`Error resetting settings: ${error.message}`);
    throw error;
  }
};

/**
 * Invalidate specific settings cache keys
 * @param {Array<String>} keys - Array of keys to invalidate
 */
const invalidateSettingsCache = async (keys = []) => {
  try {
    // Always invalidate the full settings cache
    await redis.del(SETTINGS_CACHE_KEY_ALL);
    await redis.del(SETTINGS_CACHE_KEY_PUBLIC);
    
    // Invalidate specific keys
    if (keys.length > 0) {
      const cacheKeys = keys.map(key => getSettingsCacheKey(key));
      await Promise.all(cacheKeys.map(key => redis.del(key)));
    }
  } catch (error) {
    logger.error(`Error invalidating settings cache: ${error.message}`);
  }
};

/**
 * Invalidate all settings related cache
 */
const invalidateAllSettingsCache = async () => {
  try {
    // Get all keys with the settings prefix
    const keys = await redis.keys(`${SETTINGS_CACHE_KEY_PREFIX}:*`);
    if (keys.length > 0) {
      await redis.del(keys);
    }
  } catch (error) {
    logger.error(`Error invalidating all settings cache: ${error.message}`);
  }
};

/**
 * Get public settings
 * Returns only the settings that should be publicly accessible
 * @returns {Promise<Object>} Public settings
 */
const getPublicSettings = async () => {
  try {
    // Try to get from cache first
    const cachedSettings = await redis.get(SETTINGS_CACHE_KEY_PUBLIC);
    if (cachedSettings) {
      return JSON.parse(cachedSettings);
    }
    
    const settings = await getSettings();
    
    // Filter out sensitive settings
    const publicSettings = {
      site_name: settings.site_name,
      site_description: settings.site_description,
      logo_url: settings.logo_url,
      favicon_url: settings.favicon_url,
      theme: settings.theme,
      contact_info: settings.contact_info,
      social_links: settings.social_links,
      theme_options: settings.theme_options
    };
    
    // Cache the public settings
    const cacheDuration = settings.caching_settings?.cache_duration_seconds || CACHE_TTL;
    await redis.set(SETTINGS_CACHE_KEY_PUBLIC, JSON.stringify(publicSettings), 'EX', cacheDuration);
    
    return publicSettings;
  } catch (error) {
    logger.error(`Error getting public settings: ${error.message}`);
    throw error;
  }
};

/**
 * Export settings to a specified format
 * @param {String} format - Export format (json, yaml)
 * @returns {Promise<Object>} Exported settings
 */
const exportSettings = async (format = 'json') => {
  try {
    const settings = await getSettings();
    
    switch (format.toLowerCase()) {
      case 'json':
        return { 
          data: settings,
          contentType: 'application/json',
          filename: 'settings.json'
        };
      case 'yaml':
        // We would use a YAML library here
        // For now, just return JSON with a message
        return {
          data: settings,
          contentType: 'application/json',
          filename: 'settings.json',
          message: 'YAML format would require a YAML library'
        };
      default:
        throw new ValidationError('Unsupported export format');
    }
  } catch (error) {
    logger.error(`Error exporting settings: ${error.message}`);
    throw error;
  }
};

/**
 * Import settings from provided data
 * @param {Object} data - Settings data to import
 * @param {Object} options - Options including user information for audit
 * @returns {Promise<Object>} Imported settings
 */
const importSettings = async (data, options = {}) => {
  try {
    // Validate all settings data
    Object.entries(data).forEach(([key, value]) => {
      validateSettingsField(key, value);
    });
    
    // Update with imported data
    const settings = await updateSettings(data, { 
      ...options,
      action: 'settings_import'
    });
    
    // Log the import for audit
    if (options.userId) {
      logger.info(`Settings imported by user ${options.userId}`, {
        userId: options.userId,
        action: 'settings_import'
      });
    }
    
    return settings;
  } catch (error) {
    logger.error(`Error importing settings: ${error.message}`);
    throw error;
  }
};

module.exports = {
  getSettings,
  getSettingsByKey,
  updateSettings,
  updateSettingsByKey,
  resetSettings,
  getPublicSettings,
  exportSettings,
  importSettings,
  DEFAULT_SETTINGS
}; 