/**
 * Search Controller
 * Enhanced with improved search capabilities
 */
const searchService = require('../services/search.service');
const { ValidationError } = require('../../../shared/errors');
const logger = require('../../../shared/utils/logger');

/**
 * Global search across all content types
 */
exports.globalSearch = async (req, res, next) => {
  try {
    const { q, types, limit, offset, usePersonalization = 'true' } = req.query;
    
    // Validate search query
    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      throw new ValidationError('Search query must be at least 2 characters long');
    }
    
    // Parse types if provided
    let parsedTypes = [];
    if (types) {
      try {
        parsedTypes = types.split(',').map(type => type.trim().toLowerCase());
      } catch (error) {
        throw new ValidationError('Invalid content types format');
      }
    }
    
    // Parse pagination parameters
    const parsedLimit = parseInt(limit) || 20;
    const parsedOffset = parseInt(offset) || 0;
    
    // Get user ID if authenticated
    const userId = req.user ? req.user.id : null;
    
    // Start performance measurement
    const startTime = process.hrtime();
    
    // Check if we should use personalized search
    const enablePersonalization = usePersonalization === 'true' && userId;
    
    // Perform search
    const results = enablePersonalization 
      ? await searchService.personalizedSearch(q, {
          types: parsedTypes,
          limit: Math.min(parsedLimit, 50), // Cap at 50 for performance
          offset: parsedOffset,
          userId
        })
      : await searchService.globalSearch(q, {
          types: parsedTypes,
          limit: Math.min(parsedLimit, 50), // Cap at 50 for performance
          offset: parsedOffset,
          userId
        });
    
    // Calculate execution time
    const endTime = process.hrtime(startTime);
    const queryTime = (endTime[0] * 1000 + endTime[1] / 1000000).toFixed(2);
    
    // Log search for analytics
    await searchService.logSearchQuery(q, {
      userId,
      resultCount: results.total,
      sessionId: req.sessionID,
      queryTime: parseFloat(queryTime),
      req
    });
    
    return res.json(results);
  } catch (error) {
    logger.error('Error in global search', { error: error.message });
    next(error);
  }
};

/**
 * Search within a specific content type
 */
exports.searchByContentType = async (req, res, next) => {
  try {
    const { contentType } = req.params;
    const { q, limit, offset, sort, includeFacets, ...filterParams } = req.query;
    
    // Validate search query
    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      throw new ValidationError('Search query must be at least 2 characters long');
    }
    
    // Parse pagination parameters
    const parsedLimit = parseInt(limit) || 25;
    const parsedOffset = parseInt(offset) || 0;
    
    // Valid sort options
    const validSorts = ['relevance', 'date', 'title'];
    const parsedSort = validSorts.includes(sort) ? sort : 'relevance';
    
    // Parse includeFacets parameter
    const shouldIncludeFacets = includeFacets === 'true';
    
    // Process filter parameters
    let filters = {};
    
    try {
      // First, try to parse filters from JSON if provided
      if (filterParams.filters && typeof filterParams.filters === 'string') {
        filters = JSON.parse(filterParams.filters);
      } else {
        // If not provided as JSON, extract from query parameters
        // Extract common filter types
        if (filterParams.dateRange) filters.dates = filterParams.dateRange;
        if (filterParams.tags) {
          filters.tags = Array.isArray(filterParams.tags) 
            ? filterParams.tags 
            : [filterParams.tags];
        }
        if (filterParams.category) filters.category = filterParams.category;
        if (filterParams.techStack) {
          filters.techStack = Array.isArray(filterParams.techStack) 
            ? filterParams.techStack 
            : [filterParams.techStack];
        }
        if (filterParams.companies) {
          filters.companies = Array.isArray(filterParams.companies) 
            ? filterParams.companies 
            : [filterParams.companies];
        }
        if (filterParams.institutions) {
          filters.institutions = Array.isArray(filterParams.institutions) 
            ? filterParams.institutions 
            : [filterParams.institutions];
        }
        
        // Add any remaining filter parameters 
        Object.entries(filterParams).forEach(([key, value]) => {
          if (!['q', 'limit', 'offset', 'sort', 'includeFacets', 'dateRange', 'tags', 'category', 'techStack', 'companies', 'institutions'].includes(key)) {
            filters[key] = value;
          }
        });
      }
    } catch (error) {
      logger.warn('Error parsing filters', { error: error.message });
      // Continue with empty filters on error
      filters = {};
    }
    
    // Get user ID if authenticated
    const userId = req.user ? req.user.id : null;
    
    // Start performance measurement
    const startTime = process.hrtime();
    
    // Perform search by content type
    const results = await searchService.searchByContentType(contentType, q, {
      limit: Math.min(parsedLimit, 50), // Cap at 50 for performance
      offset: parsedOffset,
      sort: parsedSort,
      filters,
      includeFacets: shouldIncludeFacets,
      userId
    });
    
    // Calculate execution time
    const endTime = process.hrtime(startTime);
    const queryTime = (endTime[0] * 1000 + endTime[1] / 1000000).toFixed(2);
    
    // Log search for analytics
    await searchService.logSearchQuery(q, {
      userId,
      contentType,
      resultCount: results.metadata.totalCount,
      sessionId: req.sessionID,
      queryTime: parseFloat(queryTime),
      filters,
      req
    });
    
    return res.json(results);
  } catch (error) {
    logger.error('Error in content type search', { 
      error: error.message,
      contentType: req.params.contentType 
    });
    next(error);
  }
};

/**
 * Get search suggestions for autocomplete
 */
exports.getSearchSuggestions = async (req, res, next) => {
  try {
    const { q, types, limit } = req.query;
    
    // Validate search query
    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      throw new ValidationError('Search query must be at least 2 characters long');
    }
    
    // Parse types if provided
    let parsedTypes = [];
    if (types) {
      try {
        parsedTypes = types.split(',').map(type => type.trim().toLowerCase());
      } catch (error) {
        throw new ValidationError('Invalid content types format');
      }
    }
    
    // Parse limit parameter
    const parsedLimit = parseInt(limit) || 5;
    
    // Get user ID if authenticated
    const userId = req.user ? req.user.id : null;
    
    // Get search suggestions
    const suggestions = await searchService.getSearchSuggestions(q, {
      types: parsedTypes,
      limit: Math.min(parsedLimit, 10), // Cap at 10 for performance
      userId
    });
    
    // Log suggestion query for analytics (do not await to avoid delaying response)
    searchService.logSearchQuery(q, {
      userId,
      contentType: 'suggestions',
      resultCount: suggestions.suggestions.length,
      sessionId: req.sessionID,
      req
    }).catch(err => {
      logger.error('Error logging suggestion query', { error: err.message });
    });
    
    return res.json(suggestions);
  } catch (error) {
    logger.error('Error getting search suggestions', { error: error.message });
    next(error);
  }
}; 