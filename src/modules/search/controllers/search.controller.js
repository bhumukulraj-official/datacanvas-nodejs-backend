/**
 * Search Controller
 * Handles HTTP requests for search operations
 */
const { searchService } = require('../services');
const { catchAsync } = require('../../../shared/utils');
const { BadRequestError } = require('../../../shared/errors');

/**
 * Global search across all content types
 */
exports.globalSearch = catchAsync(async (req, res) => {
  const { q, types, limit, offset } = req.query;
  
  // Convert types to array if it's a string
  let typesArray = types;
  if (types && !Array.isArray(types)) {
    typesArray = [types];
  }
  
  const options = {
    types: typesArray,
    limit: parseInt(limit, 10) || 20,
    offset: parseInt(offset, 10) || 0,
    userId: req.user?.id // Optional user ID for personalized results
  };
  
  const searchResults = await searchService.globalSearch(q, options);
  
  res.status(200).json({
    success: true,
    data: searchResults.items,
    metadata: {
      query: q,
      total: searchResults.total,
      limit: options.limit,
      offset: options.offset
    }
  });
});

/**
 * Search within a specific content type
 */
exports.searchByContentType = catchAsync(async (req, res) => {
  const { contentType } = req.params;
  const { q, limit, offset, sort, filters } = req.query;
  
  const options = {
    limit: parseInt(limit, 10) || 25,
    offset: parseInt(offset, 10) || 0,
    sort: sort || 'relevance',
    filters: filters ? JSON.parse(filters) : {}
  };
  
  try {
    const results = await searchService.searchByContentType(contentType, q, options);
    
    res.status(200).json({
      success: true,
      data: results.results,
      metadata: results.metadata
    });
  } catch (error) {
    if (error instanceof BadRequestError) {
      return res.status(400).json({
        success: false,
        error: {
          message: error.message,
          code: 'SEARCH_001'
        }
      });
    }
    throw error;
  }
}); 