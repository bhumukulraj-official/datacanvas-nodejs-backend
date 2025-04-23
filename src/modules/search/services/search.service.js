/**
 * Search Service
 * Enhanced version that leverages PostgreSQL's full-text search capabilities
 */
const { Op } = require('sequelize');
const sequelize = require('../../../shared/database');
const { BadRequestError } = require('../../../shared/errors');
const { Project } = require('../../projects/models');
const { BlogPost } = require('../../blog/models');
const { Skill } = require('../../skills/models');
const { Experience } = require('../../experience/models');
const { Education } = require('../../education/models');
const { Testimonial } = require('../../testimonials/models');
const { redis } = require('../../../shared/cache');
const logger = require('../../../shared/utils/logger');

// Import search services
const searchAnalytics = require('./search-analytics.service');
const searchHighlightsService = require('./search-highlights.service');
const searchQueryService = require('./search-query.service');
const searchFacetsService = require('./search-facets.service');

// Import configuration
const { 
  CONTENT_TYPE_MAP, 
  SEARCH_CACHE_KEY_PREFIX, 
  getContentTypePriority 
} = require('./search-config');

/**
 * Formats search results to a consistent structure with highlighted matches and proper URLs
 */
const formatSearchResults = async (results, contentType, query) => {
  if (!results || results.length === 0) return [];
  
  const config = CONTENT_TYPE_MAP[contentType];
  
  // Process results with highlighting
  const formattedResults = [];
  
  for (const result of results) {
    try {
      // Format result with highlights
      const formattedResult = await searchHighlightsService.formatResultWithHighlights(
        result, 
        contentType, 
        query, 
        config
      );
      
      formattedResults.push(formattedResult);
    } catch (error) {
      logger.error('Error formatting search result with highlights', { 
        error: error.message,
        contentType,
        id: result.id 
      });
      
      // Fallback to basic formatting if highlighting fails
      const item = result.toJSON ? result.toJSON() : result;
      
      formattedResults.push({
        id: item.id,
        title: item[config.titleField],
        contentType,
        date: item[config.dateField],
        preview: item.description || item.content || item.summary || '',
        url: `/${contentType}/${item.id}`,
        data: item
      });
    }
  }
  
  return formattedResults;
};

/**
 * Create a safe tsquery from user input
 * @param {string} query - User search query
 * @param {boolean} usePrefix - Whether to enable prefix matching
 * @returns {Object} - Safe query objects for Sequelize
 */
const createSafeTextSearchQuery = (query) => {
  // Strip any potentially unsafe characters
  const safeQuery = query
    .replace(/[!@#$%^&*()+=\[\]{}|\\:;"'<>,.?\/]/g, ' ')
    .trim();
  
  if (!safeQuery) {
    throw new BadRequestError('Search query contains no valid terms');
  }
  
  // Split into words for processing
  const words = safeQuery.split(/\s+/);
  
  return {
    // For searching
    plainQuery: safeQuery,
    // Original words for pattern matching fallback
    words
  };
};

/**
 * Build a full-text search condition for a content type
 */
const buildFullTextSearch = (contentType, queryText) => {
  const config = CONTENT_TYPE_MAP[contentType];
  const safeQuery = createSafeTextSearchQuery(queryText);
  
  // For blog posts, use the searchVector column directly
  if (contentType === 'blog' && config.hasSearchVector) {
    const searchCondition = searchQueryService.buildFullTextCondition('"searchVector"', safeQuery.plainQuery);
    const rankExpression = searchQueryService.buildRankingExpression('"searchVector"', safeQuery.plainQuery);
    
    return {
      whereClause: sequelize.literal(searchCondition),
      orderBy: sequelize.literal(`${rankExpression} DESC`)
    };
  }
  
  // For other content types, build a tsvector on the fly
  const tsvectorExpression = [];
  
  Object.entries(config.tsFields).forEach(([field, weight]) => {
    tsvectorExpression.push(`setweight(to_tsvector('english', COALESCE("${field}"::text, '')), '${weight}')`);
  });
  
  const combinedTsvector = tsvectorExpression.join(' || ');
  
  // Use advanced query service for better search capabilities
  const searchCondition = searchQueryService.buildFullTextCondition(`(${combinedTsvector})`, safeQuery.plainQuery); 
  const rankExpression = searchQueryService.buildRankingExpression(`(${combinedTsvector})`, safeQuery.plainQuery);
  
  return {
    whereClause: sequelize.literal(searchCondition),
    orderBy: sequelize.literal(`${rankExpression} DESC`)
  };
};

/**
 * Build a fallback ILIKE search condition
 */
const buildFallbackSearch = (contentType, query) => {
  const config = CONTENT_TYPE_MAP[contentType];
  const safeQuery = createSafeTextSearchQuery(query);
  
  const conditions = [];
  const words = safeQuery.words;
  
  config.fields.forEach(field => {
    words.forEach(word => {
      if (word.length >= 2) {
        conditions.push({
          [field]: { [Op.iLike]: `%${word}%` }
        });
      }
    });
  });
  
  // Prioritize exact matches in title fields
  const orderBy = [
    [sequelize.literal(`CASE WHEN "${config.titleField}" ILIKE '%${safeQuery.plainQuery.replace(/'/g, "''")}%' THEN 1 ELSE 2 END`), 'ASC'],
    [config.dateField, 'DESC']
  ];
  
  return {
    whereClause: { [Op.or]: conditions },
    orderBy
  };
};

/**
 * Perform a global search across all content types
 */
exports.globalSearch = async (query, options = {}) => {
  const { types = [], limit = 20, offset = 0, userId } = options;
  
  // Generate cache key
  const cacheKey = `${SEARCH_CACHE_KEY_PREFIX}global:${query}:${types.join(',')}:${limit}:${offset}:${userId || 'public'}`;
  
  // Try to get from cache first
  const cachedResults = await redis.get(cacheKey);
  if (cachedResults) {
    return JSON.parse(cachedResults);
  }
  
  // If no specific types provided, search all types
  const searchTypes = types.length > 0 ? types : Object.keys(CONTENT_TYPE_MAP);
  
  // Initialize results object
  const results = {
    total: 0,
    items: []
  };
  
  // Execute parallel searches for each content type
  const searchPromises = searchTypes.map(async (contentType) => {
    try {
      const config = CONTENT_TYPE_MAP[contentType];
      
      // Try full-text search first
      let searchCondition, orderClause;
      
      try {
        const fullTextSearch = buildFullTextSearch(contentType, query);
        searchCondition = fullTextSearch.whereClause;
        orderClause = [fullTextSearch.orderBy];
      } catch (error) {
        logger.warn(`Full-text search failed for ${contentType}, falling back to ILIKE`, { error: error.message });
        const fallbackSearch = buildFallbackSearch(contentType, query);
        searchCondition = fallbackSearch.whereClause;
        orderClause = fallbackSearch.orderBy;
      }
      
      // Build the complete where clause
      const whereClause = {
        [Op.and]: [
          searchCondition
        ]
      };
      
      // Add user filter if needed
      if (userId) {
        whereClause[Op.and].push({ user_id: userId });
      }
      
      // Add status filter for content types that have it
      if (config.statusField && config.validStatus) {
        whereClause[Op.and].push({ [config.statusField]: config.validStatus });
      }
      
      // Get results for this content type
      const contentResults = await config.model.findAll({
        where: whereClause,
        limit: Math.min(limit * 2, 50), // Get more results than needed to allow for combined ranking
        order: orderClause,
        attributes: { 
          include: [
            [sequelize.literal('1'), 'searchRelevance'] // Placeholder for relevance ordering
          ]
        }
      });
      
      return { contentType, results: contentResults };
    } catch (error) {
      logger.error(`Error searching ${contentType}`, { error: error.message, query });
      return { contentType, results: [] }; // Return empty array on error to continue with other content types
    }
  });
  
  // Wait for all searches to complete
  const searchResults = await Promise.all(searchPromises);
  
  // Format and combine all results
  const formattingPromises = searchResults.map(async ({ contentType, results: contentResults }) => {
    const typePriority = getContentTypePriority(contentType);
    
    // Format the results with highlights
    const formattedItems = await formatSearchResults(contentResults, contentType, query);
    
    // Add type priority for sorting
    return formattedItems.map(item => ({
      ...item,
      typePriority
    }));
  });
  
  // Wait for all formatting to complete
  const allFormattedResults = await Promise.all(formattingPromises);
  
  // Combine all formatted results
  results.items = allFormattedResults.flat();
  
  // Sort all results by type priority and date
  results.items.sort((a, b) => {
    // First sort by type priority
    if (a.typePriority !== b.typePriority) {
      return a.typePriority - b.typePriority;
    }
    
    // Then by date (if available)
    if (a.date && b.date) {
      return new Date(b.date) - new Date(a.date);
    }
    
    return 0;
  });
  
  // Remove the typePriority field before returning
  results.items.forEach(item => {
    delete item.typePriority;
  });
  
  // Apply pagination
  results.total = results.items.length;
  results.items = results.items.slice(offset, offset + limit);
  
  // Add metadata
  results.metadata = {
    query,
    types: searchTypes,
    limit,
    offset
  };
  
  // Cache the results for 5 minutes
  await redis.set(cacheKey, JSON.stringify(results), 'EX', 300);
  
  return results;
};

/**
 * Search within a specific content type
 */
exports.searchByContentType = async (contentType, query, options = {}) => {
  const { limit = 25, offset = 0, sort = 'relevance', filters = {}, includeFacets = false } = options;
  
  // Validate content type
  if (!CONTENT_TYPE_MAP[contentType]) {
    throw new BadRequestError(`Invalid content type: ${contentType}`);
  }
  
  // Generate cache key
  const facetsParam = includeFacets ? 'withFacets' : 'noFacets';
  const cacheKey = `${SEARCH_CACHE_KEY_PREFIX}${contentType}:${query}:${limit}:${offset}:${sort}:${facetsParam}:${JSON.stringify(filters)}`;
  
  // Try to get from cache first
  const cachedResults = await redis.get(cacheKey);
  if (cachedResults) {
    return JSON.parse(cachedResults);
  }
  
  const config = CONTENT_TYPE_MAP[contentType];
  
  // Parse filters into Sequelize format
  const parsedFilters = searchFacetsService.parseFilters(filters, contentType);
  
  // Try full-text search first
  let searchCondition, orderClause;
  
  try {
    if (sort === 'relevance') {
      const fullTextSearch = buildFullTextSearch(contentType, query);
      searchCondition = fullTextSearch.whereClause;
      orderClause = [fullTextSearch.orderBy];
    } else {
      // Use full-text search but with custom ordering
      searchCondition = buildFullTextSearch(contentType, query).whereClause;
      
      if (sort === 'date') {
        orderClause = [[config.dateField, 'DESC']];
      } else if (sort === 'title') {
        orderClause = [[config.titleField, 'ASC']];
      } else {
        orderClause = [[config.dateField, 'DESC']];
      }
    }
  } catch (error) {
    logger.warn(`Full-text search failed for ${contentType}, falling back to ILIKE`, { error: error.message });
    const fallbackSearch = buildFallbackSearch(contentType, query);
    searchCondition = fallbackSearch.whereClause;
    orderClause = fallbackSearch.orderBy;
  }
  
  // Build where clause
  const whereClause = {
    [Op.and]: [
      searchCondition
    ]
  };
  
  // Add status filter for content types that have it
  if (config.statusField && config.validStatus) {
    whereClause[Op.and].push({ [config.statusField]: config.validStatus });
  }
  
  // Add any additional filters
  if (Object.keys(parsedFilters).length > 0) {
    Object.entries(parsedFilters).forEach(([key, value]) => {
      // Special case for date filters which are SQL fragments
      if (key === 'dateFilter') {
        whereClause[Op.and].push(sequelize.literal(value));
      } else {
        whereClause[Op.and].push({ [key]: value });
      }
    });
  }
  
  // Get results
  const { count, rows } = await config.model.findAndCountAll({
    where: whereClause,
    limit,
    offset,
    order: orderClause
  });
  
  // Format results with highlighting
  const formattedResults = await formatSearchResults(rows, contentType, query);
  
  // Build response
  const response = {
    results: formattedResults,
    metadata: {
      contentType,
      query,
      totalCount: count,
      limit,
      offset,
      sort,
      filters: parsedFilters
    }
  };
  
  // Generate facets if requested
  if (includeFacets) {
    response.facets = await searchFacetsService.generateFacets(contentType, whereClause);
  }
  
  // Cache the results for 5 minutes
  await redis.set(cacheKey, JSON.stringify(response), 'EX', 300);
  
  return response;
};

/**
 * Get search suggestions for autocomplete
 */
exports.getSearchSuggestions = async (query, options = {}) => {
  if (!query || query.length < 2) {
    return { suggestions: [] };
  }
  
  const { limit = 5, types = [] } = options;
  
  // Generate cache key
  const cacheKey = `${SEARCH_CACHE_KEY_PREFIX}suggest:${query}:${types.join(',')}:${limit}`;
  
  // Try to get from cache first
  const cachedResults = await redis.get(cacheKey);
  if (cachedResults) {
    return JSON.parse(cachedResults);
  }
  
  // Get search results with limited fields for suggestions
  const searchResults = await exports.globalSearch(query, {
    types,
    limit,
    offset: 0
  });
  
  // Format as suggestions
  const suggestions = searchResults.items.map(item => ({
    type: item.contentType,
    title: item.title,
    preview: item.snippet || item.preview,
    url: item.url
  }));
  
  // Add fuzzy search suggestions for potentially misspelled queries
  let didYouMean = [];
  
  // Only add fuzzy suggestions if there are few exact matches
  if (suggestions.length < 3) {
    try {
      const fuzzyResults = await searchQueryService.generateFuzzySearchSuggestions(query, {
        contentType: types.length === 1 ? types[0] : null,
        limit: 3
      });
      
      didYouMean = fuzzyResults.map(result => ({
        query: result.query,
        score: parseFloat(result.similarity_score).toFixed(2)
      }));
    } catch (error) {
      logger.error('Error getting fuzzy search suggestions', { error: error.message });
      // Continue without fuzzy suggestions on error
    }
  }
  
  const response = {
    query,
    suggestions,
    didYouMean
  };
  
  // Cache the results for 5 minutes
  await redis.set(cacheKey, JSON.stringify(response), 'EX', 300);
  
  return response;
};

/**
 * Perform a global search across all content types with personalization
 */
exports.personalizedSearch = async (query, options = {}) => {
  const { types = [], limit = 20, offset = 0, userId } = options;
  
  // If no user ID provided, return standard search results
  if (!userId) {
    return exports.globalSearch(query, options);
  }
  
  // Generate cache key
  const cacheKey = `${SEARCH_CACHE_KEY_PREFIX}personalized:${query}:${types.join(',')}:${limit}:${offset}:${userId}`;
  
  // Try to get from cache first
  const cachedResults = await redis.get(cacheKey);
  if (cachedResults) {
    return JSON.parse(cachedResults);
  }
  
  // Get regular search results first
  const standardResults = await exports.globalSearch(query, options);
  
  try {
    // Get user's search history
    const searchHistory = await searchAnalytics.getUserSearchHistory(userId, { limit: 50 });
    
    if (!searchHistory || !searchHistory.searches || searchHistory.searches.length === 0) {
      // No history, return standard results
      return standardResults;
    }
    
    // Create a map of content types the user tends to search for
    const contentTypePreferences = {};
    const queryTermPreferences = {};
    
    // Process search history
    searchHistory.searches.forEach(search => {
      // Count content type preferences
      if (search.contentType) {
        contentTypePreferences[search.contentType] = (contentTypePreferences[search.contentType] || 0) + 1;
      }
      
      // Extract query terms for term preference analysis
      const terms = search.query.toLowerCase().split(/\s+/);
      terms.forEach(term => {
        if (term.length > 2) {
          queryTermPreferences[term] = (queryTermPreferences[term] || 0) + 1;
        }
      });
    });
    
    // Calculate scores for results based on user preferences
    const personalizedItems = standardResults.items.map(item => {
      let personalScore = 1.0;
      
      // Apply content type preference boost
      if (contentTypePreferences[item.contentType]) {
        const typeBoost = Math.min(contentTypePreferences[item.contentType] / 10, 2.0);
        personalScore *= (1 + typeBoost);
      }
      
      // Apply query term preference boost
      const itemTerms = (item.title + ' ' + (item.preview || '')).toLowerCase().split(/\s+/);
      let termMatchCount = 0;
      
      itemTerms.forEach(term => {
        if (queryTermPreferences[term]) {
          termMatchCount += queryTermPreferences[term];
        }
      });
      
      if (termMatchCount > 0) {
        const termBoost = Math.min(termMatchCount / 20, 1.5);
        personalScore *= (1 + termBoost);
      }
      
      return {
        ...item,
        personalScore
      };
    });
    
    // Sort by personalized score
    personalizedItems.sort((a, b) => b.personalScore - a.personalScore);
    
    // Remove the personalScore field before returning
    const finalItems = personalizedItems.map(item => {
      const { personalScore, ...rest } = item;
      return rest;
    });
    
    // Apply pagination
    const results = {
      ...standardResults,
      items: finalItems.slice(offset, offset + limit),
      isPersonalized: true
    };
    
    // Cache the results for 5 minutes
    await redis.set(cacheKey, JSON.stringify(results), 'EX', 300);
    
    return results;
  } catch (error) {
    logger.error('Error in personalized search', { error: error.message, userId });
    // Fall back to standard results
    return standardResults;
  }
};

/**
 * Log search query for analytics
 */
exports.logSearchQuery = async (query, options = {}) => {
  const { userId, contentType, resultCount, sessionId } = options;
  
  // Get request information if available
  const request = options.req || null;
  const userAgent = request ? request.headers['user-agent'] : null;
  const ipAddress = request ? (
    request.headers['x-forwarded-for'] || 
    request.connection.remoteAddress
  ) : null;
  
  try {
    // Use the new analytics service to log the search query
    await searchAnalytics.logSearchQuery(query, {
      userId,
      contentType,
      resultCount,
      sessionId,
      filters: options.filters || null,
      queryTime: options.queryTime || null,
      userAgent,
      ipAddress
    });
    
    return true;
  } catch (error) {
    logger.error('Failed to log search query', { error: error.message });
    return false;
  }
};

// Export analytics methods
exports.getPopularSearches = searchAnalytics.getPopularSearches;
exports.getZeroResultSearches = searchAnalytics.getZeroResultSearches;
exports.getSearchTrends = searchAnalytics.getSearchTrends;
exports.getUserSearchHistory = searchAnalytics.getUserSearchHistory;
exports.getSearchStats = searchAnalytics.getSearchStats;

/**
 * Get content type priority for search results
 * Lower numbers appear higher in results
 */
function getContentTypePriority(contentType) {
  const priorities = {
    blog: 1,
    projects: 2,
    experience: 3,
    skills: 4,
    education: 5,
    testimonials: 6
  };
  
  return priorities[contentType] || 10;
} 