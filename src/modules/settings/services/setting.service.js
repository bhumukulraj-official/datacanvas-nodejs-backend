/**
 * Settings Service
 * Handles business logic for settings operations
 */
const Setting = require('../models/Setting');
const { NotFoundError } = require('../../../shared/errors');
const { redis } = require('../../../shared/cache');

// Cache key for settings
const SETTINGS_CACHE_KEY = 'site:settings';

/**
 * Get all settings
 */
exports.getSettings = async () => {
  // Try to get from cache first
  const cachedSettings = await redis.get(SETTINGS_CACHE_KEY);
  if (cachedSettings) {
    return JSON.parse(cachedSettings);
  }

  // Get from database if not in cache
  let settings = await Setting.findOne();
  
  // Create default settings if none exists
  if (!settings) {
    settings = await Setting.create({
      site_name: 'My Portfolio',
      site_description: 'My professional portfolio website',
      theme: { mode: 'light' },
      contact_info: {},
      social_links: {},
      seo_settings: {},
      analytics_settings: {},
      theme_options: {},
      privacy_settings: {},
      notification_settings: {},
      caching_settings: {},
      security_settings: {}
    });
  }
  
  // Cache the settings
  await redis.set(SETTINGS_CACHE_KEY, JSON.stringify(settings), 'EX', 3600); // Cache for 1 hour
  
  return settings;
};

/**
 * Update settings
 */
exports.updateSettings = async (settingsData) => {
  let settings = await Setting.findOne();
  
  // Create default settings if none exists
  if (!settings) {
    settings = await Setting.create({
      site_name: 'My Portfolio',
      site_description: 'My professional portfolio website',
      ...settingsData
    });
  } else {
    // Update existing settings
    await settings.update(settingsData);
  }
  
  // Invalidate cache
  await redis.del(SETTINGS_CACHE_KEY);
  
  return settings;
};

/**
 * Update a single setting by key
 */
exports.updateSetting = async (key, value) => {
  let settings = await Setting.findOne();
  
  // Create default settings if none exists
  if (!settings) {
    const defaultSettings = {
      site_name: 'My Portfolio',
      site_description: 'My professional portfolio website'
    };
    defaultSettings[key] = value;
    
    settings = await Setting.create(defaultSettings);
  } else {
    // Update the specific key
    const updateData = {};
    updateData[key] = value;
    
    await settings.update(updateData);
  }
  
  // Invalidate cache
  await redis.del(SETTINGS_CACHE_KEY);
  
  return settings;
};

/**
 * Get a single setting by key
 */
exports.getSetting = async (key) => {
  // Try to get from cache first
  const cachedSettings = await redis.get(SETTINGS_CACHE_KEY);
  if (cachedSettings) {
    const settings = JSON.parse(cachedSettings);
    return { [key]: settings[key] };
  }

  // Get from database if not in cache
  const settings = await Setting.findOne();
  
  if (!settings) {
    throw new NotFoundError('Settings not found');
  }
  
  return { [key]: settings[key] };
};

/**
 * Get public settings
 * Returns only the settings that should be publicly accessible
 */
exports.getPublicSettings = async () => {
  const settings = await this.getSettings();
  
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
  
  return publicSettings;
}; 