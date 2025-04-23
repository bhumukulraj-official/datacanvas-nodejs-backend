/**
 * Search Query Service
 * Handles advanced search query processing and transformation
 */
const { BadRequestError } = require('../../../shared/errors');
const logger = require('../../../shared/utils/logger');

/**
 * Parse a search query and detect any special operators
 * @param {string} query - The original search query
 * @returns {Object} - Parsed query information
 */
exports.parseSearchQuery = (query) => {
  if (!query || typeof query !== 'string') {
    return { plainQuery: '', parsedQuery: '', hasOperators: false };
  }

  try {
    // Trim query and normalize whitespace
    const trimmedQuery = query.trim().replace(/\s+/g, ' ');
    
    // Check for phrase search (terms in quotes)
    const phraseMatches = trimmedQuery.match(/"([^"]*)"/g);
    const hasPhrase = !!phraseMatches;
    
    // Check for explicit operators
    const hasAND = trimmedQuery.match(/\s+AND\s+/i) !== null;
    const hasOR = trimmedQuery.match(/\s+OR\s+/i) !== null;
    const hasNOT = trimmedQuery.match(/NOT\s+/i) !== null || trimmedQuery.includes('-');
    
    // Determine if query has any special operators
    const hasOperators = hasPhrase || hasAND || hasOR || hasNOT;
    
    // Return information about the query
    return {
      plainQuery: trimmedQuery,
      hasOperators,
      hasPhrase,
      hasAND,
      hasOR,
      hasNOT,
      phrases: phraseMatches ? phraseMatches.map(p => p.replace(/"/g, '')) : []
    };
  } catch (error) {
    logger.error('Error parsing search query', { error: error.message, query });
    return { plainQuery: query, parsedQuery: query, hasOperators: false };
  }
};

/**
 * Create a PostgreSQL tsquery from search query with advanced operator support
 * @param {string} query - The original search query
 * @returns {Object} - Safe query for PostgreSQL
 */
exports.createAdvancedTsQuery = (query) => {
  // Bail early on empty queries
  if (!query || typeof query !== 'string' || !query.trim()) {
    throw new BadRequestError('Search query cannot be empty');
  }
  
  try {
    // Parse the query to detect operators
    const parsedQuery = exports.parseSearchQuery(query);
    const { plainQuery, hasOperators } = parsedQuery;
    
    // If no advanced operators, return simple plainto_tsquery
    if (!hasOperators) {
      return {
        queryText: `plainto_tsquery('english', '${plainQuery.replace(/'/g, "''")}')`
      };
    }
    
    let tsqueryText = plainQuery;
    
    // Handle phrase searches (terms in quotes)
    if (parsedQuery.hasPhrase) {
      // Find all phrases in quotes
      const matches = plainQuery.match(/"([^"]*)"/g) || [];
      
      for (const phrase of matches) {
        // Clean up phrase and convert spaces to AND operators for exact phrase matching
        const cleanPhrase = phrase.replace(/"/g, '').trim();
        
        if (cleanPhrase) {
          // Convert phrase "word1 word2" to "word1 <-> word2" for phrase searching
          const phraseTsquery = cleanPhrase
            .split(/\s+/)
            .map(word => word.replace(/'/g, "''"))
            .join(' <-> ');
          
          // Replace quoted phrase with phrase tsquery
          tsqueryText = tsqueryText.replace(phrase, `(${phraseTsquery})`);
        } else {
          // Empty phrase, just remove it
          tsqueryText = tsqueryText.replace(phrase, '');
        }
      }
    }
    
    // Handle NOT operator (terms with minus prefix)
    if (parsedQuery.hasNOT) {
      // Look for terms with - prefix
      const terms = tsqueryText.split(/\s+/);
      const processedTerms = [];
      
      for (const term of terms) {
        if (term.startsWith('-') && term.length > 1) {
          // Convert -word to !word
          processedTerms.push(`!${term.substring(1)}`);
        } else if (term.toLowerCase() === 'not' && processedTerms.length > 0) {
          // If we see NOT, apply it to the next term
          const nextIndex = terms.indexOf(term) + 1;
          if (nextIndex < terms.length) {
            processedTerms.push(`!${terms[nextIndex]}`);
            terms.splice(nextIndex, 1); // Remove the next term as we've processed it
          }
        } else {
          processedTerms.push(term);
        }
      }
      
      tsqueryText = processedTerms.join(' ');
    }
    
    // Handle AND and OR operators
    // First convert all spaces to & (AND) if no explicit OR
    if (!parsedQuery.hasOR) {
      tsqueryText = tsqueryText.replace(/\s+/g, ' & ');
    } else {
      // Otherwise handle explicit AND/OR operators
      tsqueryText = tsqueryText
        .replace(/\s+AND\s+/gi, ' & ')
        .replace(/\s+OR\s+/gi, ' | ');
    }
    
    // Clean up any remaining spaces
    tsqueryText = tsqueryText.replace(/\s+/g, ' ').trim();
    
    return {
      queryText: `to_tsquery('english', '${tsqueryText.replace(/'/g, "''")}')`
    };
  } catch (error) {
    logger.error('Error creating advanced tsquery', { error: error.message, query });
    
    // Fallback to simpler query
    return {
      queryText: `plainto_tsquery('english', '${query.replace(/'/g, "''")}')`
    };
  }
};

/**
 * Build a full-text search condition with support for advanced query syntax
 * @param {string} columnName - Database column name or tsvector expression
 * @param {string} query - User search query
 * @returns {string} - SQL condition for full-text search
 */
exports.buildFullTextCondition = (columnName, query) => {
  try {
    const { queryText } = exports.createAdvancedTsQuery(query);
    return `${columnName} @@ ${queryText}`;
  } catch (error) {
    logger.error('Error building full-text condition', { error: error.message, columnName, query });
    
    // Fallback to simple query
    return `${columnName} @@ plainto_tsquery('english', '${query.replace(/'/g, "''")}')`;
  }
};

/**
 * Build a ranking expression for ordering results by relevance
 * @param {string} columnName - Database column name or tsvector expression
 * @param {string} query - User search query
 * @returns {string} - SQL expression for ranking by relevance
 */
exports.buildRankingExpression = (columnName, query) => {
  try {
    const { queryText } = exports.createAdvancedTsQuery(query);
    return `ts_rank(${columnName}, ${queryText})`;
  } catch (error) {
    logger.error('Error building ranking expression', { error: error.message, columnName, query });
    
    // Fallback to simple query
    return `ts_rank(${columnName}, plainto_tsquery('english', '${query.replace(/'/g, "''")}'))`;
  }
};

/**
 * Generate fuzzy search suggestions using trigram similarity
 * Provides "did you mean" suggestions for potentially misspelled searches
 * 
 * @param {string} query - The original search query
 * @param {Object} options - Additional options for fuzzy matching
 * @returns {Promise<Array>} - List of suggested queries
 */
exports.generateFuzzySearchSuggestions = async (query, options = {}) => {
  const sequelize = require('../../../shared/database');
  const { contentType = null, limit = 5, similarityThreshold = 0.3 } = options;
  
  try {
    if (!query || query.length < 3) return [];
    
    // Ensure pg_trgm extension is enabled (should have been done in migrations)
    await sequelize.query('CREATE EXTENSION IF NOT EXISTS pg_trgm;');
    
    // Build the query to find similar search terms from past successful searches
    let fuzzyQuery = `
      SELECT 
        query,
        similarity(query, :searchQuery) AS similarity_score
      FROM search_logs
      WHERE 
        result_count > 0
        AND similarity(query, :searchQuery) > :threshold
    `;
    
    // Add content type filter if specified
    if (contentType) {
      fuzzyQuery += ` AND (content_type = :contentType OR content_type IS NULL)`;
    }
    
    fuzzyQuery += `
      GROUP BY query
      ORDER BY similarity_score DESC, COUNT(*) DESC
      LIMIT :limit
    `;
    
    const suggestions = await sequelize.query(fuzzyQuery, {
      replacements: {
        searchQuery: query,
        threshold: similarityThreshold,
        contentType,
        limit
      },
      type: sequelize.QueryTypes.SELECT
    });
    
    return suggestions;
  } catch (error) {
    logger.error('Error generating fuzzy search suggestions', { error: error.message, query });
    return [];
  }
}; 