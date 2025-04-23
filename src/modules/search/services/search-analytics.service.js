/**
 * Search Analytics Service
 * Handles storing and analyzing search queries and results
 */
const { Op } = require('sequelize');
const { SearchLog } = require('../models');
const { redis } = require('../../../shared/cache');
const logger = require('../../../shared/utils/logger');

/**
 * Log a search query to the database
 * @param {string} query - The search query
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - The created log entry
 */
exports.logSearchQuery = async (query, options = {}) => {
  const {
    userId,
    sessionId,
    contentType,
    resultCount,
    filters,
    queryTime,
    userAgent,
    ipAddress
  } = options;

  try {
    // Start performance measurement
    const startTime = process.hrtime();

    // Create search log entry
    const searchLog = await SearchLog.create({
      query,
      userId,
      sessionId,
      contentType,
      resultCount: resultCount || 0,
      filters: filters ? JSON.stringify(filters) : null,
      queryTime,
      userAgent,
      ipAddress
    });

    // Calculate time taken
    const endTime = process.hrtime(startTime);
    const executionTime = (endTime[0] * 1000 + endTime[1] / 1000000).toFixed(2);

    logger.info('Search query logged', {
      query,
      userId,
      contentType,
      resultCount,
      executionTime: `${executionTime}ms`
    });

    return searchLog;
  } catch (error) {
    logger.error('Error logging search query', {
      error: error.message,
      query
    });
    
    // Don't throw the error - logging should be non-blocking
    return null;
  }
};

/**
 * Get popular search queries
 * @param {Object} options - Filter options
 * @returns {Promise<Array>} - List of popular queries
 */
exports.getPopularSearches = async (options = {}) => {
  const {
    limit = 10,
    days = 7,
    contentType = null
  } = options;

  // Create cache key based on parameters
  const cacheKey = `search:popular:${contentType || 'all'}:${days}:${limit}`;
  
  // Try to get from cache
  const cachedResults = await redis.get(cacheKey);
  if (cachedResults) {
    return JSON.parse(cachedResults);
  }

  try {
    // Calculate the date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build where clause
    const whereClause = {
      createdAt: {
        [Op.gte]: startDate
      }
    };

    // Add content type if specified
    if (contentType) {
      whereClause.contentType = contentType;
    }

    // Get query counts grouped by query text
    const results = await SearchLog.findAll({
      attributes: [
        'query',
        [SearchLog.sequelize.fn('COUNT', SearchLog.sequelize.col('id')), 'count'],
        [SearchLog.sequelize.fn('AVG', SearchLog.sequelize.col('result_count')), 'avgResults'],
        [SearchLog.sequelize.fn('MAX', SearchLog.sequelize.col('created_at')), 'lastSearched']
      ],
      where: whereClause,
      group: ['query'],
      order: [[SearchLog.sequelize.literal('count'), 'DESC']],
      limit
    });

    // Format the results
    const formattedResults = results.map(result => ({
      query: result.query,
      count: parseInt(result.get('count')),
      avgResults: parseFloat(result.get('avgResults')).toFixed(1),
      lastSearched: result.get('lastSearched')
    }));

    // Cache results for 1 hour
    await redis.set(cacheKey, JSON.stringify(formattedResults), 'EX', 3600);

    return formattedResults;
  } catch (error) {
    logger.error('Error getting popular searches', {
      error: error.message,
      options
    });
    return [];
  }
};

/**
 * Get zero-result searches
 * @param {Object} options - Filter options
 * @returns {Promise<Array>} - List of zero-result searches
 */
exports.getZeroResultSearches = async (options = {}) => {
  const {
    limit = 10,
    days = 7,
    contentType = null
  } = options;

  // Create cache key based on parameters
  const cacheKey = `search:zeroresults:${contentType || 'all'}:${days}:${limit}`;
  
  // Try to get from cache
  const cachedResults = await redis.get(cacheKey);
  if (cachedResults) {
    return JSON.parse(cachedResults);
  }

  try {
    // Calculate the date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build where clause
    const whereClause = {
      createdAt: {
        [Op.gte]: startDate
      },
      resultCount: 0
    };

    // Add content type if specified
    if (contentType) {
      whereClause.contentType = contentType;
    }

    // Get query counts grouped by query text
    const results = await SearchLog.findAll({
      attributes: [
        'query',
        [SearchLog.sequelize.fn('COUNT', SearchLog.sequelize.col('id')), 'count'],
        [SearchLog.sequelize.fn('MAX', SearchLog.sequelize.col('created_at')), 'lastSearched']
      ],
      where: whereClause,
      group: ['query'],
      order: [[SearchLog.sequelize.literal('count'), 'DESC']],
      limit
    });

    // Format the results
    const formattedResults = results.map(result => ({
      query: result.query,
      count: parseInt(result.get('count')),
      lastSearched: result.get('lastSearched')
    }));

    // Cache results for 1 hour
    await redis.set(cacheKey, JSON.stringify(formattedResults), 'EX', 3600);

    return formattedResults;
  } catch (error) {
    logger.error('Error getting zero-result searches', {
      error: error.message,
      options
    });
    return [];
  }
};

/**
 * Get search trends over time
 * @param {Object} options - Filter options
 * @returns {Promise<Array>} - Time series data of search volume
 */
exports.getSearchTrends = async (options = {}) => {
  const {
    days = 30,
    contentType = null,
    interval = 'day' // 'hour', 'day', 'week', 'month'
  } = options;

  // Create cache key based on parameters
  const cacheKey = `search:trends:${contentType || 'all'}:${days}:${interval}`;
  
  // Try to get from cache
  const cachedResults = await redis.get(cacheKey);
  if (cachedResults) {
    return JSON.parse(cachedResults);
  }

  try {
    // Calculate the date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build where clause
    const whereClause = {
      createdAt: {
        [Op.gte]: startDate
      }
    };

    // Add content type if specified
    if (contentType) {
      whereClause.contentType = contentType;
    }

    // Define time interval for grouping
    let timeGroup;
    switch (interval) {
      case 'hour':
        timeGroup = "date_trunc('hour', created_at)";
        break;
      case 'week':
        timeGroup = "date_trunc('week', created_at)";
        break;
      case 'month':
        timeGroup = "date_trunc('month', created_at)";
        break;
      case 'day':
      default:
        timeGroup = "date_trunc('day', created_at)";
    }

    // Get query counts grouped by time interval
    const results = await SearchLog.findAll({
      attributes: [
        [SearchLog.sequelize.literal(timeGroup), 'timeInterval'],
        [SearchLog.sequelize.fn('COUNT', SearchLog.sequelize.col('id')), 'count']
      ],
      where: whereClause,
      group: ['timeInterval'],
      order: [[SearchLog.sequelize.literal('timeInterval'), 'ASC']]
    });

    // Format the results
    const formattedResults = results.map(result => ({
      date: result.get('timeInterval'),
      count: parseInt(result.get('count'))
    }));

    // Cache results for 1 hour
    await redis.set(cacheKey, JSON.stringify(formattedResults), 'EX', 3600);

    return formattedResults;
  } catch (error) {
    logger.error('Error getting search trends', {
      error: error.message,
      options
    });
    return [];
  }
};

/**
 * Get user search history
 * @param {number} userId - User ID
 * @param {Object} options - Filter options
 * @returns {Promise<Array>} - User's search history
 */
exports.getUserSearchHistory = async (userId, options = {}) => {
  const {
    limit = 20,
    offset = 0
  } = options;

  if (!userId) {
    return {
      searches: [],
      total: 0
    };
  }

  try {
    // Get search logs for the user, ordered by most recent first
    const { count, rows } = await SearchLog.findAndCountAll({
      where: {
        userId
      },
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    // Format the results
    const searches = rows.map(log => ({
      id: log.id,
      query: log.query,
      contentType: log.contentType,
      resultCount: log.resultCount,
      timestamp: log.createdAt
    }));

    return {
      searches,
      total: count
    };
  } catch (error) {
    logger.error('Error getting user search history', {
      error: error.message,
      userId
    });
    return {
      searches: [],
      total: 0
    };
  }
};

/**
 * Get search statistics
 * @param {Object} options - Filter options
 * @returns {Promise<Object>} - Search statistics
 */
exports.getSearchStats = async (options = {}) => {
  const {
    days = 7,
    contentType = null
  } = options;

  // Create cache key based on parameters
  const cacheKey = `search:stats:${contentType || 'all'}:${days}`;
  
  // Try to get from cache
  const cachedResults = await redis.get(cacheKey);
  if (cachedResults) {
    return JSON.parse(cachedResults);
  }

  try {
    // Calculate the date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build where clause
    const whereClause = {
      createdAt: {
        [Op.gte]: startDate
      }
    };

    // Add content type if specified
    if (contentType) {
      whereClause.contentType = contentType;
    }

    // Get total search count
    const totalSearches = await SearchLog.count({
      where: whereClause
    });

    // Get unique query count
    const uniqueQueries = await SearchLog.count({
      distinct: true,
      col: 'query',
      where: whereClause
    });

    // Get zero result count
    const zeroResults = await SearchLog.count({
      where: {
        ...whereClause,
        resultCount: 0
      }
    });

    // Get average results per search
    const avgResultsQuery = await SearchLog.findOne({
      attributes: [
        [SearchLog.sequelize.fn('AVG', SearchLog.sequelize.col('result_count')), 'avg']
      ],
      where: whereClause
    });
    const avgResults = parseFloat(avgResultsQuery.get('avg') || 0).toFixed(1);

    // Get average query time if available
    let avgQueryTime = null;
    const avgTimeQuery = await SearchLog.findOne({
      attributes: [
        [SearchLog.sequelize.fn('AVG', SearchLog.sequelize.col('query_time')), 'avg']
      ],
      where: {
        ...whereClause,
        queryTime: {
          [Op.not]: null
        }
      }
    });
    
    if (avgTimeQuery && avgTimeQuery.get('avg')) {
      avgQueryTime = parseFloat(avgTimeQuery.get('avg')).toFixed(2);
    }

    // Compile statistics
    const stats = {
      totalSearches,
      uniqueQueries,
      zeroResults,
      zeroResultPercentage: totalSearches ? ((zeroResults / totalSearches) * 100).toFixed(1) : 0,
      avgResults,
      avgQueryTime,
      period: `${days} days`,
      contentType: contentType || 'all'
    };

    // Cache results for 1 hour
    await redis.set(cacheKey, JSON.stringify(stats), 'EX', 3600);

    return stats;
  } catch (error) {
    logger.error('Error getting search statistics', {
      error: error.message,
      options
    });
    
    return {
      totalSearches: 0,
      uniqueQueries: 0,
      zeroResults: 0,
      zeroResultPercentage: 0,
      avgResults: 0,
      period: `${days} days`,
      contentType: contentType || 'all',
      error: 'Failed to retrieve statistics'
    };
  }
}; 