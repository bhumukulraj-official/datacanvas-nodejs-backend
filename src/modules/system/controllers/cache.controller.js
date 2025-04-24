/**
 * Cache controller
 * Handles HTTP requests for cache operations
 */
const cacheService = require('../services/cache.service');
const { catchAsync } = require('../../../shared/utils/errors');

/**
 * Get cache statistics
 * @route GET /api/v1/admin/system/cache/stats
 */
exports.getCacheStats = catchAsync(async (req, res) => {
  const stats = await cacheService.getStats();
  
  res.status(200).json({
    success: true,
    message: 'Cache statistics retrieved successfully',
    data: stats
  });
});

/**
 * Clear all cache items
 * @route POST /api/v1/admin/system/cache/clear
 */
exports.clearAllCache = catchAsync(async (req, res) => {
  const result = await cacheService.clearAll();
  
  if (result) {
    res.status(200).json({
      success: true,
      message: 'All cache items cleared successfully'
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache'
    });
  }
});

/**
 * Clear cache items in a namespace
 * @route POST /api/v1/admin/system/cache/clear/:namespace
 */
exports.clearNamespaceCache = catchAsync(async (req, res) => {
  const { namespace } = req.params;
  
  try {
    const result = await cacheService.clearNamespace(namespace);
    
    if (result) {
      res.status(200).json({
        success: true,
        message: `Cache namespace '${namespace}' cleared successfully`
      });
    } else {
      res.status(500).json({
        success: false,
        message: `Failed to clear cache namespace '${namespace}'`
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get a cache item
 * @route GET /api/v1/admin/system/cache/item
 */
exports.getCacheItem = catchAsync(async (req, res) => {
  const { key, namespace } = req.query;
  
  if (!key) {
    return res.status(400).json({
      success: false,
      message: 'Cache key is required'
    });
  }
  
  const value = await cacheService.get(key, namespace || 'api');
  
  if (value === null) {
    return res.status(404).json({
      success: false,
      message: `Cache item with key '${key}' not found`
    });
  }
  
  res.status(200).json({
    success: true,
    message: 'Cache item retrieved successfully',
    data: {
      key,
      namespace: namespace || 'api',
      value
    }
  });
});

/**
 * Delete a cache item
 * @route DELETE /api/v1/admin/system/cache/item
 */
exports.deleteCacheItem = catchAsync(async (req, res) => {
  const { key, namespace } = req.query;
  
  if (!key) {
    return res.status(400).json({
      success: false,
      message: 'Cache key is required'
    });
  }
  
  const result = await cacheService.del(key, namespace || 'api');
  
  if (result) {
    res.status(200).json({
      success: true,
      message: `Cache item with key '${key}' deleted successfully`
    });
  } else {
    res.status(500).json({
      success: false,
      message: `Failed to delete cache item with key '${key}'`
    });
  }
}); 