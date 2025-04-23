const apiKeyService = require('../services/api-key.service');
const { NotFoundError, PermissionError } = require('../../../shared/errors');

/**
 * Get all API keys with pagination
 */
exports.listApiKeys = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const result = await apiKeyService.getApiKeys(page, limit);
    
    return res.status(200).json({
      success: true,
      data: result,
      message: 'API keys retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get an API key by ID
 */
exports.getApiKey = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const apiKey = await apiKeyService.getApiKeyById(id);
    
    return res.status(200).json({
      success: true,
      data: apiKey,
      message: 'API key retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new API key
 */
exports.createApiKey = async (req, res, next) => {
  try {
    const apiKeyData = req.body;
    
    const { apiKey, apiKeyObj } = await apiKeyService.createApiKey(apiKeyData);
    
    return res.status(201).json({
      success: true,
      data: {
        apiKey,
        ...apiKeyObj
      },
      message: 'API key created successfully. Keep this key safe as it won\'t be shown again.',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an API key
 */
exports.updateApiKey = async (req, res, next) => {
  try {
    const { id } = req.params;
    const apiKeyData = req.body;
    
    const apiKey = await apiKeyService.updateApiKey(id, apiKeyData);
    
    return res.status(200).json({
      success: true,
      data: apiKey,
      message: 'API key updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Revoke an API key
 */
exports.revokeApiKey = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await apiKeyService.revokeApiKey(id);
    
    return res.status(200).json({
      success: true,
      message: 'API key revoked successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an API key
 */
exports.deleteApiKey = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await apiKeyService.deleteApiKey(id);
    
    return res.status(200).json({
      success: true,
      message: 'API key deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
}; 