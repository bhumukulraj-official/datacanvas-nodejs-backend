/**
 * API Key Service
 * Handles business logic for API key operations
 */
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const { ApiKey, ApiKeyUsage } = require('../models');
const { AppError, NotFoundError, BadRequestError } = require('../../../shared/errors');
const { sequelize } = require('../../../shared/database');
const logger = require('../../../shared/utils/logger');
const AuditLog = require('../models/AuditLog');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate a new API key and secret
 * @returns {Object} Generated key and secret
 */
function generateKeyAndSecret() {
  // Generate a secure random key (32 bytes, base64 encoded)
  const key = crypto.randomBytes(32).toString('base64').replace(/[/+=]/g, '').slice(0, 32);
  
  // Generate a secure random secret (48 bytes, base64 encoded)
  const secret = crypto.randomBytes(48).toString('base64').replace(/[/+=]/g, '').slice(0, 48);
  
  return { key, secret };
}

/**
 * Calculate expiration date based on time and unit
 * @param {number} time - Amount of time
 * @param {string} unit - Time unit (hours, days, months, years)
 * @returns {Date} Expiration date
 */
function calculateExpirationDate(time, unit) {
  const now = new Date();
  
  switch (unit) {
    case 'hours':
      now.setHours(now.getHours() + time);
      break;
    case 'days':
      now.setDate(now.getDate() + time);
      break;
    case 'months':
      now.setMonth(now.getMonth() + time);
      break;
    case 'years':
      now.setFullYear(now.getFullYear() + time);
      break;
    default:
      // Default to 30 days
      now.setDate(now.getDate() + 30);
  }
  
  return now;
}

/**
 * Generate a unique API key
 */
const generateKey = () => {
  // Create a prefix for easier identification
  const prefix = 'pk_';
  // Generate a random string
  const randomStr = crypto.randomBytes(16).toString('hex');
  return `${prefix}${randomStr}`;
};

/**
 * Generate a secret and its hash
 */
const generateSecret = () => {
  const secret = crypto.randomBytes(32).toString('base64');
  const secretHash = crypto
    .createHash('sha256')
    .update(secret)
    .digest('hex');
  
  return { secret, secretHash };
};

/**
 * Create a new API key
 * @param {number} userId - User ID
 * @param {Object} apiKeyData - API key data
 * @returns {Promise<Object>} Created API key
 */
exports.createApiKey = async (userId, apiKeyData) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { name, permissions = {}, expiresIn, expiresUnit, rateLimit, rateLimitPeriod } = apiKeyData;
    
    // Generate key and secret
    const { key, secret } = generateKeyAndSecret();
    
    // Hash the secret for storage
    const secretHash = await bcrypt.hash(secret, 10);
    
    // Calculate expiration date if provided
    let expiresAt = null;
    if (expiresIn && expiresUnit) {
      expiresAt = calculateExpirationDate(expiresIn, expiresUnit);
    }
    
    // Default permissions if not provided
    const defaultPermissions = {
      read: ['profile', 'projects'],
      write: [],
      delete: []
    };
    
    // Create the API key
    const apiKey = await ApiKey.create({
      user_id: userId,
      name,
      key,
      secret_hash: secretHash,
      permissions: permissions || defaultPermissions,
      expires_at: expiresAt,
      rate_limit: rateLimit || 100,
      rate_limit_period: rateLimitPeriod || 'minute',
      status: 'active'
    }, { transaction });
    
    // Create audit log
    await AuditLog.create({
      user_id: userId,
      action: 'create_api_key',
      entity_type: 'ApiKey',
      entity_id: apiKey.id,
      metadata: {
        name: apiKey.name,
        expires_at: apiKey.expires_at
      }
    }, { transaction });
    
    await transaction.commit();
    
    // Return the key and secret (secret will not be accessible again)
    return {
      id: apiKey.id,
      name: apiKey.name,
      key,
      secret, // Only returned on creation
      status: apiKey.status,
      permissions: apiKey.permissions,
      expiresAt: apiKey.expires_at,
      rateLimit: apiKey.rate_limit,
      rateLimitPeriod: apiKey.rate_limit_period,
      createdAt: apiKey.created_at
    };
  } catch (error) {
    await transaction.rollback();
    logger.error('Error creating API key', { error, userId });
    throw error;
  }
};

/**
 * List API keys for a user
 * @param {number} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} API keys with pagination info
 */
exports.listApiKeys = async (userId, options = {}) => {
  const { page = 1, limit = 20, status = 'active' } = options;
  const offset = (page - 1) * limit;
  
  const where = { user_id: userId };
  
  // Apply status filter
  if (status !== 'all') {
    where.status = status;
    
    // Handle expired keys (status=expired)
    if (status === 'expired') {
      where.expires_at = {
        [Op.lt]: new Date()
      };
      delete where.status; // Remove status filter as we're using expires_at
    }
  }
  
  const { count, rows } = await ApiKey.findAndCountAll({
    where,
    attributes: [
      'id', 'name', 'key', 'status', 'permissions', 'last_used_at', 
      'expires_at', 'rate_limit', 'rate_limit_period', 'created_at'
    ],
    limit,
    offset,
    order: [['created_at', 'DESC']]
  });
  
  // Format the keys for response
  const apiKeys = rows.map(key => ({
    id: key.id,
    name: key.name,
    key: key.key,
    status: key.expires_at && key.expires_at < new Date() ? 'expired' : key.status,
    permissions: key.permissions,
    lastUsed: key.last_used_at,
    expiresAt: key.expires_at,
    rateLimit: key.rate_limit,
    rateLimitPeriod: key.rate_limit_period,
    createdAt: key.created_at
  }));
  
  return {
    apiKeys,
    pagination: {
      total: count,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      pages: Math.ceil(count / limit)
    }
  };
};

/**
 * Get an API key by ID
 * @param {number} id - API key ID
 * @param {number} userId - User ID (for permission check)
 * @returns {Promise<Object>} API key
 */
exports.getApiKeyById = async (id, userId) => {
  const apiKey = await ApiKey.findOne({
    where: {
      id,
      user_id: userId
    },
    attributes: [
      'id', 'name', 'key', 'status', 'permissions', 'last_used_at', 
      'expires_at', 'rate_limit', 'rate_limit_period', 'created_at', 'updated_at'
    ]
  });
  
  if (!apiKey) {
    throw new NotFoundError('API key not found');
  }
  
  // Check if the key is expired
  const isExpired = apiKey.expires_at && apiKey.expires_at < new Date();
  
  return {
    id: apiKey.id,
    name: apiKey.name,
    key: apiKey.key,
    status: isExpired ? 'expired' : apiKey.status,
    permissions: apiKey.permissions,
    lastUsed: apiKey.last_used_at,
    expiresAt: apiKey.expires_at,
    rateLimit: apiKey.rate_limit,
    rateLimitPeriod: apiKey.rate_limit_period,
    createdAt: apiKey.created_at,
    updatedAt: apiKey.updated_at
  };
};

/**
 * Update an API key
 * @param {number} id - API key ID
 * @param {number} userId - User ID (for permission check)
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated API key
 */
exports.updateApiKey = async (id, userId, updateData) => {
  const transaction = await sequelize.transaction();
  
  try {
    const apiKey = await ApiKey.findOne({
      where: {
        id,
        user_id: userId
      }
    });
    
    if (!apiKey) {
      throw new NotFoundError('API key not found');
    }
    
    // Don't allow updating a revoked or expired key
    if (apiKey.status !== 'active') {
      throw new BadRequestError(`Cannot update a ${apiKey.status} API key`);
    }
    
    // Store original values for audit log
    const originalValues = {
      name: apiKey.name,
      status: apiKey.status,
      permissions: apiKey.permissions,
      rate_limit: apiKey.rate_limit,
      rate_limit_period: apiKey.rate_limit_period,
      expires_at: apiKey.expires_at
    };
    
    // Update the API key
    await apiKey.update({
      name: updateData.name !== undefined ? updateData.name : apiKey.name,
      status: updateData.status !== undefined ? updateData.status : apiKey.status,
      permissions: updateData.permissions !== undefined ? updateData.permissions : apiKey.permissions,
      rate_limit: updateData.rateLimit !== undefined ? updateData.rateLimit : apiKey.rate_limit,
      rate_limit_period: updateData.rateLimitPeriod !== undefined ? updateData.rateLimitPeriod : apiKey.rate_limit_period,
      expires_at: updateData.expiresAt !== undefined ? new Date(updateData.expiresAt) : apiKey.expires_at
    }, { transaction });
    
    // Track changes for audit log
    const changes = {};
    Object.keys(originalValues).forEach(key => {
      const newKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()); // Convert snake_case to camelCase
      const newValue = updateData[newKey];
      
      if (newValue !== undefined && JSON.stringify(originalValues[key]) !== JSON.stringify(newValue)) {
        changes[key] = {
          from: originalValues[key],
          to: newValue
        };
      }
    });
    
    // Create audit log if there are changes
    if (Object.keys(changes).length > 0) {
      await AuditLog.create({
        user_id: userId,
        action: 'update_api_key',
        entity_type: 'ApiKey',
        entity_id: id,
        metadata: {
          changes,
          key_id: id
        }
      }, { transaction });
    }
    
    await transaction.commit();
    
    // Check if the key is expired
    const isExpired = apiKey.expires_at && apiKey.expires_at < new Date();
    
    return {
      id: apiKey.id,
      name: apiKey.name,
      key: apiKey.key,
      status: isExpired ? 'expired' : apiKey.status,
      permissions: apiKey.permissions,
      lastUsed: apiKey.last_used_at,
      expiresAt: apiKey.expires_at,
      rateLimit: apiKey.rate_limit,
      rateLimitPeriod: apiKey.rate_limit_period,
      updatedAt: apiKey.updated_at
    };
  } catch (error) {
    await transaction.rollback();
    logger.error('Error updating API key', { error, id, userId });
    throw error;
  }
};

/**
 * Delete an API key
 * @param {number} id - API key ID
 * @param {number} userId - User ID (for permission check)
 * @returns {Promise<boolean>} Success status
 */
exports.deleteApiKey = async (id, userId) => {
  const transaction = await sequelize.transaction();
  
  try {
    const apiKey = await ApiKey.findOne({
      where: {
        id,
        user_id: userId
      }
    });
    
    if (!apiKey) {
      throw new NotFoundError('API key not found');
    }
    
    // Store key info for audit log
    const keyInfo = {
      id: apiKey.id,
      name: apiKey.name,
      key: apiKey.key
    };
    
    // Delete the API key
    await apiKey.destroy({ transaction });
    
    // Create audit log
    await AuditLog.create({
      user_id: userId,
      action: 'delete_api_key',
      entity_type: 'ApiKey',
      entity_id: id,
      metadata: keyInfo
    }, { transaction });
    
    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    logger.error('Error deleting API key', { error, id, userId });
    throw error;
  }
};

/**
 * Revoke an API key
 * @param {number} id - API key ID
 * @param {number} userId - User ID (for permission check)
 * @returns {Promise<Object>} Updated API key
 */
exports.revokeApiKey = async (id, userId) => {
  const transaction = await sequelize.transaction();
  
  try {
    const apiKey = await ApiKey.findOne({
      where: {
        id,
        user_id: userId
      }
    });
    
    if (!apiKey) {
      throw new NotFoundError('API key not found');
    }
    
    // Don't revoke an already revoked key
    if (apiKey.status === 'revoked') {
      throw new BadRequestError('API key is already revoked');
    }
    
    // Update status to revoked
    await apiKey.update({
      status: 'revoked'
    }, { transaction });
    
    // Create audit log
    await AuditLog.create({
      user_id: userId,
      action: 'revoke_api_key',
      entity_type: 'ApiKey',
      entity_id: id,
      metadata: {
        name: apiKey.name,
        key: apiKey.key
      }
    }, { transaction });
    
    await transaction.commit();
    
    return {
      id: apiKey.id,
      name: apiKey.name,
      key: apiKey.key,
      status: 'revoked',
      updatedAt: apiKey.updated_at
    };
  } catch (error) {
    await transaction.rollback();
    logger.error('Error revoking API key', { error, id, userId });
    throw error;
  }
};

/**
 * Get API key usage stats
 * @param {number} id - API key ID
 * @param {number} userId - User ID (for permission check)
 * @param {Object} options - Query options
 * @returns {Promise<Object>} API key usage data
 */
exports.getApiKeyUsage = async (id, userId, options = {}) => {
  const { page = 1, limit = 20, startDate, endDate } = options;
  const offset = (page - 1) * limit;
  
  // Verify that the API key belongs to the user
  const apiKey = await ApiKey.findOne({
    where: {
      id,
      user_id: userId
    }
  });
  
  if (!apiKey) {
    throw new NotFoundError('API key not found');
  }
  
  // Build the where clause for the query
  const where = { api_key_id: id };
  
  // Add date range filters if provided
  if (startDate || endDate) {
    where.created_at = {};
    
    if (startDate) {
      where.created_at[Op.gte] = new Date(startDate);
    }
    
    if (endDate) {
      where.created_at[Op.lte] = new Date(endDate);
    }
  }
  
  // Get the usage records
  const { count, rows } = await ApiKeyUsage.findAndCountAll({
    where,
    limit,
    offset,
    order: [['created_at', 'DESC']]
  });
  
  // Get summary statistics
  const summary = await ApiKeyUsage.findAll({
    where,
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('id')), 'totalRequests'],
      [sequelize.fn('AVG', sequelize.col('response_time_ms')), 'avgResponseTime'],
      [sequelize.fn('COUNT', sequelize.literal("CASE WHEN status_code >= 400 THEN 1 END")), 'errors'],
      [sequelize.fn('COUNT', sequelize.literal("CASE WHEN status_code < 400 THEN 1 END")), 'successful']
    ],
    raw: true
  });
  
  // Get usage by endpoint
  const endpointStats = await ApiKeyUsage.findAll({
    where,
    attributes: [
      'endpoint',
      'method',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      [sequelize.fn('AVG', sequelize.col('response_time_ms')), 'avgResponseTime']
    ],
    group: ['endpoint', 'method'],
    order: [[sequelize.literal('count'), 'DESC']],
    limit: 10,
    raw: true
  });
  
  return {
    usage: rows,
    summary: summary[0] || {
      totalRequests: 0,
      avgResponseTime: 0,
      errors: 0,
      successful: 0
    },
    endpointStats,
    pagination: {
      total: count,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      pages: Math.ceil(count / limit)
    }
  };
};

/**
 * Refresh an API key (generate new key and secret)
 * @param {number} id - API key ID
 * @param {number} userId - User ID (for permission check)
 * @returns {Promise<Object>} New API key and secret
 */
exports.refreshApiKey = async (id, userId) => {
  const transaction = await sequelize.transaction();
  
  try {
    const apiKey = await ApiKey.findOne({
      where: {
        id,
        user_id: userId
      }
    });
    
    if (!apiKey) {
      throw new NotFoundError('API key not found');
    }
    
    // Generate new key and secret
    const { key, secret } = generateKeyAndSecret();
    
    // Hash the new secret
    const secretHash = await bcrypt.hash(secret, 10);
    
    // Store the old key for audit log
    const oldKey = apiKey.key;
    
    // Update the API key
    await apiKey.update({
      key,
      secret_hash: secretHash,
      // Reset last_used_at since this is a new key
      last_used_at: null
    }, { transaction });
    
    // Create audit log
    await AuditLog.create({
      user_id: userId,
      action: 'refresh_api_key',
      entity_type: 'ApiKey',
      entity_id: id,
      metadata: {
        name: apiKey.name,
        old_key: oldKey
      }
    }, { transaction });
    
    await transaction.commit();
    
    return {
      id: apiKey.id,
      name: apiKey.name,
      key,
      secret, // Only returned on refresh
      status: apiKey.status,
      permissions: apiKey.permissions,
      expiresAt: apiKey.expires_at,
      rateLimit: apiKey.rate_limit,
      rateLimitPeriod: apiKey.rate_limit_period,
      updatedAt: apiKey.updated_at
    };
  } catch (error) {
    await transaction.rollback();
    logger.error('Error refreshing API key', { error, id, userId });
    throw error;
  }
};

/**
 * Record API key usage
 * @param {string} key - API key
 * @param {Object} usageData - Usage data
 * @returns {Promise<boolean>} Success status
 */
exports.recordApiKeyUsage = async (key, usageData) => {
  try {
    const apiKey = await ApiKey.findOne({
      where: { key }
    });
    
    if (!apiKey) {
      return false;
    }
    
    // Check if the API key is valid (not revoked or expired)
    if (apiKey.status === 'revoked' || (apiKey.expires_at && apiKey.expires_at < new Date())) {
      return false;
    }
    
    // Update last_used_at
    await apiKey.update({
      last_used_at: new Date()
    });
    
    // Create a usage record
    await ApiKeyUsage.create({
      api_key_id: apiKey.id,
      endpoint: usageData.endpoint,
      method: usageData.method,
      status_code: usageData.statusCode,
      ip_address: usageData.ipAddress,
      user_agent: usageData.userAgent,
      response_time_ms: usageData.responseTime,
      request_body: usageData.requestBody
    });
    
    return true;
  } catch (error) {
    logger.error('Error recording API key usage', { error, key });
    // Don't throw the error, just return false to avoid affecting the API response
    return false;
  }
};

/**
 * Validate an API key
 */
exports.validateApiKey = async (key) => {
  const apiKey = await ApiKey.findOne({
    where: {
      key,
      status: 'active',
      [Op.or]: [
        { expires_at: null },
        { expires_at: { [Op.gt]: new Date() } }
      ]
    }
  });
  
  if (!apiKey) {
    return null;
  }
  
  // Update last used timestamp
  await apiKey.update({
    last_used_at: new Date()
  });
  
  // Log API key usage
  await ApiKeyUsage.create({
    api_key_id: apiKey.id,
    endpoint: 'unknown', // This would typically be set by middleware
    method: 'unknown',  // This would typically be set by middleware
    ip_address: 'unknown',  // This would typically be set by middleware
    user_agent: 'unknown'  // This would typically be set by middleware
  });
  
  return apiKey;
}; 