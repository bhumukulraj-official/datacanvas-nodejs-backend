/**
 * API Key Controller
 * Handles HTTP requests for API key operations
 */
const { apiKeyService } = require('../services');
const { AppError } = require('../../../shared/errors');
const logger = require('../../../shared/utils/logger');
const { catchAsync } = require('../../../shared/utils');

/**
 * Get all API keys for the authenticated user
 */
exports.getApiKeys = catchAsync(async (req, res) => {
  const { status, limit, offset } = req.query;
  
  const options = {
    status: status || 'active',
    limit: parseInt(limit, 10) || 50,
    offset: parseInt(offset, 10) || 0
  };
  
  const { count, rows } = await apiKeyService.getApiKeys(req.user.id, options);
  
  res.status(200).json({
    success: true,
    data: rows,
    metadata: {
      total: count,
      limit: options.limit,
      offset: options.offset
    }
  });
});

/**
 * Get an API key by ID
 */
exports.getApiKeyById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const apiKey = await apiKeyService.getApiKeyById(id, req.user.id);
  
  res.status(200).json({
    success: true,
    data: apiKey
  });
});

/**
 * Create a new API key
 */
exports.createApiKey = catchAsync(async (req, res) => {
  const apiKey = await apiKeyService.createApiKey(req.user.id, req.body);
  
  res.status(201).json({
    success: true,
    data: apiKey,
    message: 'Save the secret securely. It will not be shown again.'
  });
});

/**
 * Update an API key
 */
exports.updateApiKey = catchAsync(async (req, res) => {
  const { id } = req.params;
  const apiKey = await apiKeyService.updateApiKey(id, req.user.id, req.body);
  
  res.status(200).json({
    success: true,
    data: apiKey
  });
});

/**
 * Revoke an API key
 */
exports.revokeApiKey = catchAsync(async (req, res) => {
  const { id } = req.params;
  const apiKey = await apiKeyService.revokeApiKey(id, req.user.id);
  
  res.status(200).json({
    success: true,
    data: apiKey
  });
});

/**
 * Delete an API key
 */
exports.deleteApiKey = catchAsync(async (req, res) => {
  const { id } = req.params;
  await apiKeyService.deleteApiKey(id, req.user.id);
  
  res.status(200).json({
    success: true,
    data: {
      message: 'API key deleted successfully'
    }
  });
});

/**
 * Get API key usage statistics
 */
exports.getApiKeyUsage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { page, limit, startDate, endDate } = req.query;
    
    const result = await apiKeyService.getApiKeyUsage(parseInt(id, 10), userId, {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
      startDate,
      endDate
    });
    
    res.status(200).json({
      success: true,
      data: {
        usage: result.usage,
        summary: result.summary,
        endpointStats: result.endpointStats
      },
      metadata: result.pagination,
      message: 'API key usage retrieved successfully'
    });
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 404) {
      return res.status(404).json({
        success: false,
        error: {
          message: error.message,
          code: error.errorCode
        }
      });
    }
    logger.error('Get API key usage error', { error, keyId: req.params.id });
    next(error);
  }
};

/**
 * Refresh API key (generate new credentials)
 */
exports.refreshApiKey = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const result = await apiKeyService.refreshApiKey(parseInt(id, 10), userId);
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'API key refreshed successfully. Please save the new secret as it won\'t be shown again.'
    });
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 404) {
      return res.status(404).json({
        success: false,
        error: {
          message: error.message,
          code: error.errorCode
        }
      });
    }
    logger.error('Refresh API key error', { error, keyId: req.params.id });
    next(error);
  }
}; 