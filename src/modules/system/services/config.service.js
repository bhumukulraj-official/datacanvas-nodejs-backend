/**
 * Configuration Service
 * Manages system configuration settings using the database
 */
const db = require('../../../models');
const logger = require('../../../shared/utils/logger');
const AsyncLock = require('async-lock');
const lock = new AsyncLock();
const NodeCache = require('node-cache');

// In-memory cache for config settings to reduce database queries
const configCache = new NodeCache({ 
  stdTTL: 300, // 5 minutes cache time
  checkperiod: 60 // Check for expired entries every 60 seconds
});

// Defaults for system configurations
const DEFAULT_CONFIGS = {
  'system.maintenance_mode': { value: 'false', type: 'boolean', description: 'Enables maintenance mode for the entire application' },
  'system.maintenance_message': { value: 'System is currently under maintenance. Please try again later.', type: 'string', description: 'Message to display during maintenance mode' },
  'system.allow_admin_during_maintenance': { value: 'true', type: 'boolean', description: 'Allow admin users to access the system during maintenance' },
  'system.default_page_size': { value: '10', type: 'number', description: 'Default pagination size for list endpoints' },
  'system.max_page_size': { value: '100', type: 'number', description: 'Maximum allowed page size for pagination' },
  'system.enable_rate_limiting': { value: 'true', type: 'boolean', description: 'Enable global rate limiting' },
  'system.api_cache_duration': { value: '300', type: 'number', description: 'Default cache duration for cacheable API responses in seconds' },
  'system.log_level': { value: 'info', type: 'string', description: 'Application logging level (error, warn, info, debug)' },
  'email.sender_name': { value: 'DataCanvas', type: 'string', description: 'Default sender name for emails' },
  'email.sender_email': { value: 'noreply@example.com', type: 'string', description: 'Default sender email address' },
  'security.jwt_expiration': { value: '86400', type: 'number', description: 'JWT token expiration in seconds' },
  'security.refresh_token_expiration': { value: '604800', type: 'number', description: 'Refresh token expiration in seconds' }
};

const configService = {
  /**
   * Initialize the configuration system
   * Creates default configuration entries if they don't exist
   */
  init: async () => {
    try {
      // Check if system_settings table exists
      const tableExists = await db.sequelize.query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'system_settings')",
        { type: db.sequelize.QueryTypes.SELECT }
      );
      
      if (!tableExists[0].exists) {
        logger.error('Configuration service initialization failed: system_settings table does not exist');
        return;
      }
      
      // Get all existing configs
      const existingConfigs = await db.sequelize.query(
        "SELECT key FROM system_settings", 
        { type: db.sequelize.QueryTypes.SELECT }
      );
      
      const existingKeys = existingConfigs.map(config => config.key);
      
      // Create missing default configurations
      for (const [key, config] of Object.entries(DEFAULT_CONFIGS)) {
        if (!existingKeys.includes(key)) {
          await db.sequelize.query(
            "INSERT INTO system_settings (key, value, type, description, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())", 
            { 
              replacements: [key, config.value, config.type, config.description],
              type: db.sequelize.QueryTypes.INSERT 
            }
          );
          logger.info(`Created default configuration: ${key}`);
        }
      }
      
      // Load all configurations into cache
      await configService.refreshCache();
      
      logger.info('Configuration service initialized successfully');
    } catch (error) {
      logger.error('Configuration service initialization failed', { error: error.message });
    }
  },
  
  /**
   * Refresh the configuration cache
   */
  refreshCache: async () => {
    try {
      const configs = await db.sequelize.query(
        "SELECT key, value, type FROM system_settings", 
        { type: db.sequelize.QueryTypes.SELECT }
      );
      
      configs.forEach(config => {
        configCache.set(config.key, {
          value: config.value,
          type: config.type
        });
      });
      
      return true;
    } catch (error) {
      logger.error('Failed to refresh configuration cache', { error: error.message });
      return false;
    }
  },
  
  /**
   * Get a configuration value
   * @param {string} key - Configuration key
   * @param {*} defaultValue - Default value if configuration doesn't exist
   * @returns {*} Configuration value
   */
  get: async (key, defaultValue = null) => {
    try {
      // Check cache first
      const cachedConfig = configCache.get(key);
      if (cachedConfig) {
        return configService.parseValue(cachedConfig.value, cachedConfig.type);
      }
      
      // Not in cache, try database
      const result = await db.sequelize.query(
        "SELECT value, type FROM system_settings WHERE key = ?", 
        { 
          replacements: [key],
          type: db.sequelize.QueryTypes.SELECT 
        }
      );
      
      if (result.length === 0) {
        // Check if we have a default
        if (DEFAULT_CONFIGS[key]) {
          return configService.parseValue(DEFAULT_CONFIGS[key].value, DEFAULT_CONFIGS[key].type);
        }
        return defaultValue;
      }
      
      // Add to cache
      configCache.set(key, {
        value: result[0].value,
        type: result[0].type
      });
      
      return configService.parseValue(result[0].value, result[0].type);
    } catch (error) {
      logger.error(`Error retrieving configuration: ${key}`, { error: error.message });
      
      // If we have a default configuration, use it
      if (DEFAULT_CONFIGS[key]) {
        return configService.parseValue(DEFAULT_CONFIGS[key].value, DEFAULT_CONFIGS[key].type);
      }
      
      return defaultValue;
    }
  },
  
  /**
   * Set a configuration value
   * @param {string} key - Configuration key
   * @param {*} value - New value
   * @param {string} type - Value type (string, number, boolean, json)
   * @param {string} description - Configuration description
   * @returns {boolean} Success status
   */
  set: async (key, value, type = 'string', description = null) => {
    // Acquire lock to prevent race conditions
    return await lock.acquire(key, async () => {
      try {
        // Convert value to string for storage
        const stringValue = configService.stringifyValue(value);
        
        // Check if configuration exists
        const exists = await db.sequelize.query(
          "SELECT 1 FROM system_settings WHERE key = ?", 
          { 
            replacements: [key],
            type: db.sequelize.QueryTypes.SELECT 
          }
        );
        
        if (exists.length === 0) {
          // Create new configuration
          await db.sequelize.query(
            "INSERT INTO system_settings (key, value, type, description, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())", 
            { 
              replacements: [key, stringValue, type, description || ''],
              type: db.sequelize.QueryTypes.INSERT 
            }
          );
        } else {
          // Update existing configuration
          const updateQuery = description 
            ? "UPDATE system_settings SET value = ?, type = ?, description = ?, updated_at = NOW() WHERE key = ?"
            : "UPDATE system_settings SET value = ?, type = ?, updated_at = NOW() WHERE key = ?";
            
          const replacements = description 
            ? [stringValue, type, description, key]
            : [stringValue, type, key];
            
          await db.sequelize.query(updateQuery, { 
            replacements,
            type: db.sequelize.QueryTypes.UPDATE 
          });
        }
        
        // Update cache
        configCache.set(key, {
          value: stringValue,
          type
        });
        
        // Add audit log for this change if it's an important setting
        // This would use the audit service we previously implemented
        
        return true;
      } catch (error) {
        logger.error(`Failed to set configuration: ${key}`, { error: error.message });
        return false;
      }
    });
  },
  
  /**
   * Delete a configuration
   * @param {string} key - Configuration key
   * @returns {boolean} Success status
   */
  delete: async (key) => {
    try {
      await db.sequelize.query(
        "DELETE FROM system_settings WHERE key = ?", 
        { 
          replacements: [key],
          type: db.sequelize.QueryTypes.DELETE 
        }
      );
      
      // Remove from cache
      configCache.del(key);
      
      return true;
    } catch (error) {
      logger.error(`Failed to delete configuration: ${key}`, { error: error.message });
      return false;
    }
  },
  
  /**
   * Get all configurations
   * @param {string} prefix - Optional prefix filter
   * @returns {Array} List of configurations
   */
  getAll: async (prefix = null) => {
    try {
      let query = "SELECT key, value, type, description, created_at, updated_at FROM system_settings";
      let replacements = [];
      
      if (prefix) {
        query += " WHERE key LIKE ?";
        replacements = [`${prefix}%`];
      }
      
      query += " ORDER BY key ASC";
      
      const configs = await db.sequelize.query(query, { 
        replacements,
        type: db.sequelize.QueryTypes.SELECT 
      });
      
      return configs.map(config => ({
        key: config.key,
        value: configService.parseValue(config.value, config.type),
        rawValue: config.value,
        type: config.type,
        description: config.description,
        createdAt: config.created_at,
        updatedAt: config.updated_at
      }));
    } catch (error) {
      logger.error('Failed to get configurations', { error: error.message });
      return [];
    }
  },
  
  /**
   * Parse a configuration value based on its type
   * @param {string} value - String value from database
   * @param {string} type - Value type
   * @returns {*} Parsed value
   */
  parseValue: (value, type) => {
    try {
      switch (type) {
        case 'number':
          return Number(value);
        case 'boolean':
          return value === 'true';
        case 'json':
          return JSON.parse(value);
        case 'string':
        default:
          return value;
      }
    } catch (error) {
      logger.error('Failed to parse configuration value', { 
        value, 
        type, 
        error: error.message 
      });
      return value; // Return as-is if parsing fails
    }
  },
  
  /**
   * Convert a value to string for storage
   * @param {*} value - Value to stringify
   * @returns {string} String representation
   */
  stringifyValue: (value) => {
    if (value === null || value === undefined) {
      return '';
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    return String(value);
  },
  
  /**
   * Check if maintenance mode is enabled
   * @returns {boolean} Maintenance mode status
   */
  isMaintenanceMode: async () => {
    return await configService.get('system.maintenance_mode', false);
  },
  
  /**
   * Get maintenance message
   * @returns {string} Maintenance message
   */
  getMaintenanceMessage: async () => {
    return await configService.get(
      'system.maintenance_message', 
      'System is currently under maintenance. Please try again later.'
    );
  },
  
  /**
   * Check if admins are allowed during maintenance
   * @returns {boolean} Allow admin status
   */
  allowAdminDuringMaintenance: async () => {
    return await configService.get('system.allow_admin_during_maintenance', true);
  }
};

module.exports = configService; 