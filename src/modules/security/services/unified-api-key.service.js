/**
 * Unified API Key Service
 * Consolidated implementation for API key operations
 */
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const { sequelize } = require('../../../shared/database');
const { ApiKey } = require('../models/ApiKey');
const { NotFoundError, BadRequestError } = require('../../../shared/errors');
const logger = require('../../../shared/utils/logger');
const auditService = require('./audit.service');

/**
 * Maps permission integers to their descriptive capabilities
 * Each number in permissions array corresponds to a specific capability
 */
const PERMISSION_MAP = {
  1: { name: 'read:profile', description: 'Read profile information' },
  2: { name: 'read:projects', description: 'Read projects data' },
  3: { name: 'write:projects', description: 'Create and update projects' },
  4: { name: 'delete:projects', description: 'Delete projects' },
  5: { name: 'admin:full', description: 'Full administrative access' }
};

/**
 * Get all API keys with pagination
 * @param {number} page - Page number
 * @param {number} limit - Number of items per page
 * @param {Object} filters - Optional filters (status, etc.)
 * @returns {Promise<Object>} API keys with pagination info
 */
const getApiKeys = async (page = 1, limit = 10, filters = {}) => {
  const offset = (page - 1) * limit;
  
  const whereClause = { deleted_at: null };
  
  // Apply status filter if provided
  if (filters.status) {
    whereClause.status = filters.status;
  }
  
  const { rows, count } = await ApiKey.findAndCountAll({
    limit,
    offset,
    order: [['created_at', 'DESC']],
    attributes: [
      'id', 'name', 'key_hash', 'permissions', 'status', 
      'expires_at', 'last_used_at', 'created_at', 'updated_at'
    ],
    where: whereClause
  });
  
  // Map numeric permissions to descriptive capabilities for each API key
  const apiKeys = rows.map(apiKey => {
    const mappedPermissions = apiKey.permissions.map(permId => {
      return PERMISSION_MAP[permId] || { name: `unknown:${permId}`, description: 'Unknown permission' };
    });
    
    // Check if the key is expired but still marked as active
    const isExpired = apiKey.expires_at && apiKey.expires_at < new Date() && apiKey.status === 'active';
    const effectiveStatus = isExpired ? 'expired' : apiKey.status;
    
    return {
      id: apiKey.id,
      name: apiKey.name,
      permissions: apiKey.permissions,
      mappedPermissions,
      status: effectiveStatus,
      expires_at: apiKey.expires_at,
      last_used_at: apiKey.last_used_at,
      created_at: apiKey.created_at,
      updated_at: apiKey.updated_at
    };
  });
  
  return {
    api_keys: apiKeys,
    pagination: {
      current_page: page,
      total_pages: Math.ceil(count / limit),
      total_items: count,
      items_per_page: limit
    }
  };
};

/**
 * Get an API key by ID
 * @param {number} id - API key ID
 * @returns {Promise<Object>} API key object
 */
const getApiKeyById = async (id) => {
  const apiKey = await ApiKey.findByPk(id, {
    attributes: [
      'id', 'name', 'key_hash', 'permissions', 'status', 
      'expires_at', 'last_used_at', 'created_at', 'updated_at'
    ],
    where: {
      deleted_at: null
    }
  });
  
  if (!apiKey) {
    throw new NotFoundError('API key not found');
  }
  
  // Check if the key is expired but still marked as active
  const isExpired = apiKey.expires_at && apiKey.expires_at < new Date() && apiKey.status === 'active';
  const effectiveStatus = isExpired ? 'expired' : apiKey.status;
  
  // Map numeric permissions to descriptive capabilities
  const mappedPermissions = apiKey.permissions.map(permId => {
    return PERMISSION_MAP[permId] || { name: `unknown:${permId}`, description: 'Unknown permission' };
  });
  
  return {
    id: apiKey.id,
    name: apiKey.name,
    permissions: apiKey.permissions,
    mappedPermissions,
    status: effectiveStatus,
    expires_at: apiKey.expires_at,
    last_used_at: apiKey.last_used_at,
    created_at: apiKey.created_at,
    updated_at: apiKey.updated_at
  };
};

/**
 * Generate a new API key
 * @returns {string} Generated API key
 */
const generateApiKey = () => {
  // Create a prefix for easier identification
  const prefix = 'pk_';
  // Generate a random string (32 bytes, hex encoded)
  const randomStr = crypto.randomBytes(32).toString('hex');
  return `${prefix}${randomStr}`;
};

/**
 * Hash an API key for secure storage
 * @param {string} apiKey - Raw API key
 * @returns {string} Hashed API key
 */
const hashApiKey = (apiKey) => {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
};

/**
 * Calculate expiration date based on time period
 * @param {number} value - Time value
 * @param {string} unit - Time unit (day, month, year)
 * @returns {Date} Calculated expiration date
 */
const calculateExpirationDate = (value, unit) => {
  const now = new Date();
  
  switch(unit) {
    case 'day':
      now.setDate(now.getDate() + value);
      break;
    case 'month':
      now.setMonth(now.getMonth() + value);
      break;
    case 'year':
      now.setFullYear(now.getFullYear() + value);
      break;
    default:
      throw new BadRequestError('Invalid time unit. Use day, month, or year.');
  }
  
  return now;
};

/**
 * Create a new API key
 * @param {Object} apiKeyData - API key data
 * @returns {Promise<Object>} Created API key
 */
const createApiKey = async (apiKeyData) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { 
      name, 
      permissions = [1, 2], // Default to read-only permissions
      expiresIn, 
      expiresUnit, 
      status = 'active'
    } = apiKeyData;
    
    // Generate a new API key
    const rawApiKey = generateApiKey();
    const keyHash = hashApiKey(rawApiKey);
    
    // Calculate expiration date if provided
    let expiresAt = null;
    if (expiresIn && expiresUnit) {
      expiresAt = calculateExpirationDate(expiresIn, expiresUnit);
    }
    
    // Create API key in database
    const apiKeyObj = await ApiKey.create({
      name,
      key_hash: keyHash,
      permissions: permissions,
      status,
      expires_at: expiresAt
    }, { transaction });
    
    // Log API key creation
    await auditService.logAction({
      action: 'api_key.create',
      entity_type: 'api_key',
      entity_id: apiKeyObj.id,
      description: `API key '${name}' created`,
      metadata: {
        name,
        permissions,
        expires_at: expiresAt
      }
    }, { transaction });
    
    await transaction.commit();
    
    logger.info(`API key created: ${apiKeyObj.id}`);
    
    // Map numeric permissions to descriptive capabilities
    const mappedPermissions = permissions.map(permId => {
      return PERMISSION_MAP[permId] || { name: `unknown:${permId}`, description: 'Unknown permission' };
    });
    
    return { 
      apiKey: rawApiKey, // Only returned once during creation
      apiKeyObj: {
        id: apiKeyObj.id,
        name: apiKeyObj.name,
        status: apiKeyObj.status,
        permissions: apiKeyObj.permissions,
        mappedPermissions,
        expires_at: apiKeyObj.expires_at,
        created_at: apiKeyObj.created_at
      }
    };
  } catch (error) {
    await transaction.rollback();
    logger.error(`Error creating API key: ${error.message}`);
    throw error;
  }
};

/**
 * Update an API key
 * @param {number} id - API key ID
 * @param {Object} apiKeyData - Updated API key data
 * @returns {Promise<Object>} Updated API key
 */
const updateApiKey = async (id, apiKeyData) => {
  const transaction = await sequelize.transaction();
  
  try {
    const apiKey = await ApiKey.findByPk(id);
    
    if (!apiKey) {
      throw new NotFoundError('API key not found');
    }
    
    const { name, permissions, status, expiresIn, expiresUnit } = apiKeyData;
    
    // Calculate new expiration date if provided
    let expiresAt = apiKey.expires_at;
    if (expiresIn && expiresUnit) {
      expiresAt = calculateExpirationDate(expiresIn, expiresUnit);
    }
    
    // Update API key
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (permissions !== undefined) updateData.permissions = permissions;
    if (status !== undefined) updateData.status = status;
    if (expiresAt !== undefined) updateData.expires_at = expiresAt;
    
    await apiKey.update(updateData, { transaction });
    
    // Log API key update
    await auditService.logAction({
      action: 'api_key.update',
      entity_type: 'api_key',
      entity_id: apiKey.id,
      description: `API key '${apiKey.name}' updated`,
      metadata: {
        name: apiKey.name,
        permissions: apiKey.permissions,
        status: apiKey.status,
        expires_at: apiKey.expires_at
      }
    }, { transaction });
    
    await transaction.commit();
    
    logger.info(`API key updated: ${apiKey.id}`);
    
    // Map numeric permissions to descriptive capabilities
    const mappedPermissions = apiKey.permissions.map(permId => {
      return PERMISSION_MAP[permId] || { name: `unknown:${permId}`, description: 'Unknown permission' };
    });
    
    return {
      id: apiKey.id,
      name: apiKey.name,
      permissions: apiKey.permissions,
      mappedPermissions,
      status: apiKey.status,
      expires_at: apiKey.expires_at,
      last_used_at: apiKey.last_used_at,
      created_at: apiKey.created_at,
      updated_at: apiKey.updated_at
    };
  } catch (error) {
    await transaction.rollback();
    logger.error(`Error updating API key: ${error.message}`);
    throw error;
  }
};

/**
 * Revoke an API key
 * @param {number} id - API key ID
 * @returns {Promise<Object>} Revoked API key
 */
const revokeApiKey = async (id) => {
  const transaction = await sequelize.transaction();
  
  try {
    const apiKey = await ApiKey.findByPk(id);
    
    if (!apiKey) {
      throw new NotFoundError('API key not found');
    }
    
    // Revoke API key
    await apiKey.update({
      status: 'revoked'
    }, { transaction });
    
    // Log API key revocation
    await auditService.logAction({
      action: 'api_key.revoke',
      entity_type: 'api_key',
      entity_id: apiKey.id,
      description: `API key '${apiKey.name}' revoked`,
      metadata: {
        name: apiKey.name
      }
    }, { transaction });
    
    await transaction.commit();
    
    logger.info(`API key revoked: ${apiKey.id}`);
    
    // Map numeric permissions to descriptive capabilities
    const mappedPermissions = apiKey.permissions.map(permId => {
      return PERMISSION_MAP[permId] || { name: `unknown:${permId}`, description: 'Unknown permission' };
    });
    
    return {
      id: apiKey.id,
      name: apiKey.name,
      permissions: apiKey.permissions,
      mappedPermissions,
      status: 'revoked',
      expires_at: apiKey.expires_at,
      last_used_at: apiKey.last_used_at,
      created_at: apiKey.created_at,
      updated_at: apiKey.updated_at
    };
  } catch (error) {
    await transaction.rollback();
    logger.error(`Error revoking API key: ${error.message}`);
    throw error;
  }
};

/**
 * Delete an API key
 * @param {number} id - API key ID
 * @returns {Promise<void>}
 */
const deleteApiKey = async (id) => {
  const transaction = await sequelize.transaction();
  
  try {
    const apiKey = await ApiKey.findByPk(id);
    
    if (!apiKey) {
      throw new NotFoundError('API key not found');
    }
    
    // Store key name before deletion for logging
    const keyName = apiKey.name;
    
    // Soft delete API key
    await apiKey.destroy({ transaction });
    
    // Log API key deletion
    await auditService.logAction({
      action: 'api_key.delete',
      entity_type: 'api_key',
      entity_id: id,
      description: `API key '${keyName}' deleted`,
      metadata: {
        name: keyName
      }
    }, { transaction });
    
    await transaction.commit();
    
    logger.info(`API key deleted: ${id}`);
  } catch (error) {
    await transaction.rollback();
    logger.error(`Error deleting API key: ${error.message}`);
    throw error;
  }
};

/**
 * Validate an API key and track usage
 * @param {string} apiKey - API key to validate
 * @returns {Promise<Object|null>} API key object if valid, null otherwise
 */
const validateApiKey = async (apiKey) => {
  try {
    const keyHash = hashApiKey(apiKey);
    
    const apiKeyObj = await ApiKey.findOne({
      where: {
        key_hash: keyHash,
        status: 'active',
        deleted_at: null
      }
    });
    
    if (!apiKeyObj) {
      logger.warn('API key validation failed: Key not found or inactive');
      return null;
    }
    
    // Check if expired
    if (apiKeyObj.expires_at && new Date(apiKeyObj.expires_at) < new Date()) {
      // Update status to inactive if expired
      await apiKeyObj.update({ status: 'inactive' });
      
      logger.warn(`API key expired: ${apiKeyObj.id}`);
      return null;
    }
    
    // Update last used timestamp to track usage
    await apiKeyObj.update({ last_used_at: new Date() });
    
    // Log API key usage for analytics
    await auditService.logAction({
      action: 'api_key.use',
      entity_type: 'api_key',
      entity_id: apiKeyObj.id,
      description: `API key '${apiKeyObj.name}' used`,
      metadata: {
        name: apiKeyObj.name
      }
    });
    
    return apiKeyObj;
  } catch (error) {
    logger.error(`Error validating API key: ${error.message}`);
    return null;
  }
};

/**
 * Get usage statistics for all API keys
 * @param {Object} options - Filter and grouping options
 * @returns {Promise<Object>} Usage statistics
 */
const getApiKeyUsageStats = async (options = {}) => {
  try {
    const { timeframe = '30d', groupBy = 'daily' } = options;
    
    // Calculate start date based on timeframe
    const startDate = new Date();
    const matches = timeframe.match(/^(\d+)([d|w|m])$/);
    
    if (!matches) {
      throw new BadRequestError('Invalid timeframe format. Use format like 30d, 4w, 6m');
    }
    
    const value = parseInt(matches[1], 10);
    const unit = matches[2];
    
    switch(unit) {
      case 'd': // days
        startDate.setDate(startDate.getDate() - value);
        break;
      case 'w': // weeks
        startDate.setDate(startDate.getDate() - (value * 7));
        break;
      case 'm': // months
        startDate.setMonth(startDate.getMonth() - value);
        break;
      default:
        throw new BadRequestError('Invalid timeframe unit. Use d (days), w (weeks), or m (months)');
    }
    
    // Fetch audit logs for API key usage in the specified timeframe
    const usageLogs = await auditService.getLogs({
      action: 'api_key.use',
      startDate,
      endDate: new Date()
    });
    
    // Group by API key ID
    const keyUsage = {};
    
    usageLogs.forEach(log => {
      const keyId = log.entity_id;
      
      if (!keyUsage[keyId]) {
        keyUsage[keyId] = {
          id: keyId,
          name: log.metadata.name,
          total_usage: 0,
          usage_by_date: {}
        };
      }
      
      keyUsage[keyId].total_usage++;
      
      // Group by date according to specified grouping
      let dateKey;
      const logDate = new Date(log.created_at);
      
      switch(groupBy) {
        case 'hourly':
          dateKey = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, '0')}-${String(logDate.getDate()).padStart(2, '0')} ${String(logDate.getHours()).padStart(2, '0')}:00`;
          break;
        case 'daily':
          dateKey = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, '0')}-${String(logDate.getDate()).padStart(2, '0')}`;
          break;
        case 'weekly':
          // Get the first day of the week (Sunday)
          const firstDay = new Date(logDate);
          const day = logDate.getDay();
          firstDay.setDate(logDate.getDate() - day);
          dateKey = `${firstDay.getFullYear()}-W${Math.ceil((firstDay.getDate() + 1 + (new Date(firstDay.getFullYear(), firstDay.getMonth(), 0).getDay())) / 7)}`;
          break;
        case 'monthly':
          dateKey = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          dateKey = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, '0')}-${String(logDate.getDate()).padStart(2, '0')}`;
      }
      
      if (!keyUsage[keyId].usage_by_date[dateKey]) {
        keyUsage[keyId].usage_by_date[dateKey] = 0;
      }
      
      keyUsage[keyId].usage_by_date[dateKey]++;
    });
    
    return {
      timeframe,
      groupBy,
      keys: Object.values(keyUsage)
    };
  } catch (error) {
    logger.error(`Error getting API key usage stats: ${error.message}`);
    throw error;
  }
};

module.exports = {
  getApiKeys,
  getApiKeyById,
  createApiKey,
  updateApiKey,
  revokeApiKey,
  deleteApiKey,
  validateApiKey,
  getApiKeyUsageStats,
  PERMISSION_MAP
}; 