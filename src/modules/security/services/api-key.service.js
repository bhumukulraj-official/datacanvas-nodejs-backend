const crypto = require('crypto');
const { ApiKey } = require('../models/ApiKey');
const { NotFoundError } = require('../../../shared/errors');
const logger = require('../../../shared/utils/logger');
const auditService = require('./audit.service');

/**
 * Get all API keys with pagination
 * @param {number} page - Page number
 * @param {number} limit - Number of items per page
 * @returns {object} API keys with pagination info
 */
const getApiKeys = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  
  const { rows, count } = await ApiKey.findAndCountAll({
    limit,
    offset,
    order: [['created_at', 'DESC']],
    attributes: ['id', 'name', 'permissions', 'status', 'expires_at', 'last_used_at', 'created_at', 'updated_at'],
    where: {
      deleted_at: null
    }
  });
  
  return {
    api_keys: rows,
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
 * @returns {object} API key object
 */
const getApiKeyById = async (id) => {
  const apiKey = await ApiKey.findByPk(id, {
    attributes: ['id', 'name', 'permissions', 'status', 'expires_at', 'last_used_at', 'created_at', 'updated_at'],
    where: {
      deleted_at: null
    }
  });
  
  if (!apiKey) {
    throw new NotFoundError('API key not found');
  }
  
  return apiKey;
};

/**
 * Generate a new API key
 * @returns {string} Generated API key
 */
const generateApiKey = () => {
  return crypto.randomBytes(32).toString('hex');
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
 * Create a new API key
 * @param {object} apiKeyData - API key data
 * @returns {object} Created API key
 */
const createApiKey = async (apiKeyData) => {
  try {
    // Generate API key
    const rawApiKey = generateApiKey();
    const keyHash = hashApiKey(rawApiKey);
    
    // Create API key in database
    const apiKeyObj = await ApiKey.create({
      name: apiKeyData.name,
      key_hash: keyHash,
      permissions: apiKeyData.permissions || [],
      status: apiKeyData.status || 'active',
      expires_at: apiKeyData.expires_at || null
    });
    
    // Log API key creation
    await auditService.logAction({
      action: 'api_key.create',
      entity_type: 'api_key',
      entity_id: apiKeyObj.id,
      description: `API key '${apiKeyData.name}' created`,
      metadata: {
        name: apiKeyData.name,
        permissions: apiKeyData.permissions
      }
    });
    
    logger.info(`API key created: ${apiKeyObj.id}`);
    
    return { 
      apiKey: rawApiKey, 
      apiKeyObj: {
        id: apiKeyObj.id,
        name: apiKeyObj.name,
        status: apiKeyObj.status,
        permissions: apiKeyObj.permissions,
        expires_at: apiKeyObj.expires_at,
        created_at: apiKeyObj.created_at
      }
    };
  } catch (error) {
    logger.error(`Error creating API key: ${error.message}`);
    throw error;
  }
};

/**
 * Update an API key
 * @param {number} id - API key ID
 * @param {object} apiKeyData - Updated API key data
 * @returns {object} Updated API key
 */
const updateApiKey = async (id, apiKeyData) => {
  try {
    const apiKey = await ApiKey.findByPk(id);
    
    if (!apiKey) {
      throw new NotFoundError('API key not found');
    }
    
    // Update API key
    await apiKey.update({
      name: apiKeyData.name !== undefined ? apiKeyData.name : apiKey.name,
      permissions: apiKeyData.permissions !== undefined ? apiKeyData.permissions : apiKey.permissions,
      status: apiKeyData.status !== undefined ? apiKeyData.status : apiKey.status,
      expires_at: apiKeyData.expires_at !== undefined ? apiKeyData.expires_at : apiKey.expires_at
    });
    
    // Log API key update
    await auditService.logAction({
      action: 'api_key.update',
      entity_type: 'api_key',
      entity_id: apiKey.id,
      description: `API key '${apiKey.name}' updated`,
      metadata: {
        name: apiKey.name,
        permissions: apiKey.permissions,
        status: apiKey.status
      }
    });
    
    logger.info(`API key updated: ${apiKey.id}`);
    
    return apiKey;
  } catch (error) {
    logger.error(`Error updating API key: ${error.message}`);
    throw error;
  }
};

/**
 * Revoke an API key
 * @param {number} id - API key ID
 */
const revokeApiKey = async (id) => {
  try {
    const apiKey = await ApiKey.findByPk(id);
    
    if (!apiKey) {
      throw new NotFoundError('API key not found');
    }
    
    // Revoke API key
    await apiKey.update({
      status: 'revoked'
    });
    
    // Log API key revocation
    await auditService.logAction({
      action: 'api_key.revoke',
      entity_type: 'api_key',
      entity_id: apiKey.id,
      description: `API key '${apiKey.name}' revoked`,
      metadata: {
        name: apiKey.name
      }
    });
    
    logger.info(`API key revoked: ${apiKey.id}`);
  } catch (error) {
    logger.error(`Error revoking API key: ${error.message}`);
    throw error;
  }
};

/**
 * Delete an API key
 * @param {number} id - API key ID
 */
const deleteApiKey = async (id) => {
  try {
    const apiKey = await ApiKey.findByPk(id);
    
    if (!apiKey) {
      throw new NotFoundError('API key not found');
    }
    
    const keyName = apiKey.name;
    
    // Delete API key
    await apiKey.destroy();
    
    // Log API key deletion
    await auditService.logAction({
      action: 'api_key.delete',
      entity_type: 'api_key',
      entity_id: id,
      description: `API key '${keyName}' deleted`,
      metadata: {
        name: keyName
      }
    });
    
    logger.info(`API key deleted: ${id}`);
  } catch (error) {
    logger.error(`Error deleting API key: ${error.message}`);
    throw error;
  }
};

/**
 * Validate an API key
 * @param {string} apiKey - API key to validate
 * @returns {object|null} API key object if valid, null otherwise
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
      return null;
    }
    
    // Check if expired
    if (apiKeyObj.expires_at && new Date(apiKeyObj.expires_at) < new Date()) {
      await apiKeyObj.update({
        status: 'inactive'
      });
      return null;
    }
    
    // Update last used at
    await apiKeyObj.update({
      last_used_at: new Date()
    });
    
    return apiKeyObj;
  } catch (error) {
    logger.error(`Error validating API key: ${error.message}`);
    return null;
  }
};

module.exports = {
  getApiKeys,
  getApiKeyById,
  createApiKey,
  updateApiKey,
  revokeApiKey,
  deleteApiKey,
  validateApiKey
}; 