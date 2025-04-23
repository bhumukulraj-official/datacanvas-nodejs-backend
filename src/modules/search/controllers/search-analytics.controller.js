/**
 * Search Analytics Controller
 * Provides endpoints for search analytics and insights
 */
const searchService = require('../services/search.service');
const { NotFoundError, ForbiddenError } = require('../../../shared/errors');
const logger = require('../../../shared/utils/logger');

/**
 * Get popular search queries
 */
exports.getPopularSearches = async (req, res, next) => {
  try {
    // Get parameters from query
    const { days, limit, contentType } = req.query;
    
    // Convert to appropriate types
    const options = {
      days: parseInt(days) || 7,
      limit: parseInt(limit) || 10,
      contentType: contentType || null
    };
    
    // Get popular searches
    const results = await searchService.getPopularSearches(options);
    
    return res.json({
      success: true,
      data: results,
      meta: {
        period: `${options.days} days`,
        contentType: options.contentType || 'all'
      }
    });
  } catch (error) {
    logger.error('Error getting popular searches', { error: error.message });
    next(error);
  }
};

/**
 * Get zero-result searches
 */
exports.getZeroResultSearches = async (req, res, next) => {
  try {
    // Get parameters from query
    const { days, limit, contentType } = req.query;
    
    // Convert to appropriate types
    const options = {
      days: parseInt(days) || 7,
      limit: parseInt(limit) || 10,
      contentType: contentType || null
    };
    
    // Get zero-result searches
    const results = await searchService.getZeroResultSearches(options);
    
    return res.json({
      success: true,
      data: results,
      meta: {
        period: `${options.days} days`,
        contentType: options.contentType || 'all'
      }
    });
  } catch (error) {
    logger.error('Error getting zero-result searches', { error: error.message });
    next(error);
  }
};

/**
 * Get search trends over time
 */
exports.getSearchTrends = async (req, res, next) => {
  try {
    // Get parameters from query
    const { days, contentType, interval } = req.query;
    
    // Convert to appropriate types and validate
    const options = {
      days: parseInt(days) || 30,
      contentType: contentType || null,
      interval: ['hour', 'day', 'week', 'month'].includes(interval) ? interval : 'day'
    };
    
    // Get search trends
    const results = await searchService.getSearchTrends(options);
    
    return res.json({
      success: true,
      data: results,
      meta: {
        period: `${options.days} days`,
        interval: options.interval,
        contentType: options.contentType || 'all'
      }
    });
  } catch (error) {
    logger.error('Error getting search trends', { error: error.message });
    next(error);
  }
};

/**
 * Get user search history
 */
exports.getUserSearchHistory = async (req, res, next) => {
  try {
    // Get user ID from request
    const userId = req.user ? req.user.id : null;
    
    // Check if user is authenticated
    if (!userId) {
      throw new ForbiddenError('Authentication required');
    }
    
    // Get pagination parameters
    const { limit, page } = req.query;
    const options = {
      limit: parseInt(limit) || 20,
      offset: parseInt(page) > 0 ? (parseInt(page) - 1) * (parseInt(limit) || 20) : 0
    };
    
    // Get user search history
    const { searches, total } = await searchService.getUserSearchHistory(userId, options);
    
    // Calculate pagination metadata
    const currentPage = Math.floor(options.offset / options.limit) + 1;
    const totalPages = Math.ceil(total / options.limit);
    
    return res.json({
      success: true,
      data: searches,
      meta: {
        pagination: {
          total,
          currentPage,
          totalPages,
          limit: options.limit
        }
      }
    });
  } catch (error) {
    logger.error('Error getting user search history', { error: error.message });
    next(error);
  }
};

/**
 * Get search statistics
 */
exports.getSearchStats = async (req, res, next) => {
  try {
    // Get parameters from query
    const { days, contentType } = req.query;
    
    // Convert to appropriate types
    const options = {
      days: parseInt(days) || 7,
      contentType: contentType || null
    };
    
    // Get search statistics
    const stats = await searchService.getSearchStats(options);
    
    return res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error getting search statistics', { error: error.message });
    next(error);
  }
}; 