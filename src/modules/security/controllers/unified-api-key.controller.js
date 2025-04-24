/**
 * Unified API Key Controller
 * Handles HTTP requests for API key operations
 */
const apiKeyService = require('../services/unified-api-key.service');
const { NotFoundError, BadRequestError } = require('../../../shared/errors');
const logger = require('../../../shared/utils/logger');

/**
 * Get all API keys with pagination and filtering
 */
exports.listApiKeys = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const filters = {};
    if (status) {
      filters.status = status;
    }
    
    const result = await apiKeyService.getApiKeys(
      parseInt(page, 10),
      parseInt(limit, 10),
      filters
    );
    
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
        apiKey, // Only returned once during creation
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
    
    const apiKey = await apiKeyService.revokeApiKey(id);
    
    return res.status(200).json({
      success: true,
      data: apiKey,
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

/**
 * Get API key usage statistics
 */
exports.getApiKeyUsageStats = async (req, res, next) => {
  try {
    const { timeframe = '30d', groupBy = 'daily' } = req.query;
    
    // Validate parameters
    const validTimeframePattern = /^\d+[dwm]$/;
    if (!validTimeframePattern.test(timeframe)) {
      throw new BadRequestError('Invalid timeframe format. Use format like 30d, 4w, 6m');
    }
    
    const validGroupings = ['hourly', 'daily', 'weekly', 'monthly'];
    if (!validGroupings.includes(groupBy)) {
      throw new BadRequestError('Invalid groupBy. Use hourly, daily, weekly, or monthly');
    }
    
    const stats = await apiKeyService.getApiKeyUsageStats({
      timeframe,
      groupBy
    });
    
    return res.status(200).json({
      success: true,
      data: stats,
      message: 'API key usage statistics retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get available API key permissions
 */
exports.getApiKeyPermissions = async (req, res, next) => {
  try {
    // Format permissions map into an array
    const permissions = Object.entries(apiKeyService.PERMISSION_MAP).map(([id, details]) => ({
      id: parseInt(id, 10),
      name: details.name,
      description: details.description
    }));
    
    return res.status(200).json({
      success: true,
      data: permissions,
      message: 'API key permissions retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
}; 