/**
 * Search Highlights Service
 * Provides methods for enhancing search results with highlighting and snippets
 */
const sequelize = require('../../../shared/database');
const logger = require('../../../shared/utils/logger');

/**
 * Generate highlighted text using PostgreSQL's ts_headline function
 * 
 * @param {string} text - Original text content to highlight
 * @param {string} query - Search query for highlighting
 * @param {Object} options - Highlighting options
 * @returns {string} - Text with highlighted search terms
 */
exports.generateHighlight = async (text, query, options = {}) => {
  if (!text || !query) return text;
  
  const {
    maxWords = 50,
    minWords = 15,
    shortWord = 3,
    maxFragments = 2
  } = options;
  
  const highlightOptions = `MaxWords=${maxWords}, MinWords=${minWords}, ShortWord=${shortWord}, MaxFragments=${maxFragments}`;
  
  try {
    // Clean query for PostgreSQL ts_headline function
    const safeQuery = query.replace(/[!@#$%^&*()+=\[\]{}|\\:;"'<>,.?\/]/g, ' ').trim();
    if (!safeQuery) return text;
    
    // Prepare SQL query for ts_headline
    const [result] = await sequelize.query(`
      SELECT ts_headline(
        'english',
        :text,
        plainto_tsquery('english', :query),
        :options
      ) as highlighted
    `, {
      replacements: {
        text,
        query: safeQuery,
        options: highlightOptions
      },
      type: sequelize.QueryTypes.SELECT
    });
    
    return result.highlighted || text;
  } catch (error) {
    logger.error('Error generating highlighted text', { error: error.message });
    return text;
  }
};

/**
 * Extract a relevant snippet from content based on search query
 * 
 * @param {string} content - Original content
 * @param {string} query - Search query
 * @param {Object} options - Snippet extraction options
 * @returns {string} - Extracted snippet
 */
exports.extractSnippet = (content, query, options = {}) => {
  if (!content || !query) return '';
  
  const {
    maxLength = 160,
    surroundingWords = 5
  } = options;
  
  try {
    // Clean the query
    const queryTerms = query.toLowerCase()
      .replace(/[!@#$%^&*()+=\[\]{}|\\:;"'<>,.?\/]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(term => term.length > 2);
    
    if (!queryTerms.length) {
      // If no valid terms, return the beginning of the content
      return content.length > maxLength 
        ? `${content.substring(0, maxLength)}...` 
        : content;
    }
    
    // Convert content to array of words
    const words = content.split(/\s+/);
    
    // Find the first occurrence of any query term
    let bestMatchIndex = -1;
    let bestMatchTerm = '';
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i].toLowerCase();
      
      for (const term of queryTerms) {
        if (word.includes(term)) {
          bestMatchIndex = i;
          bestMatchTerm = term;
          break;
        }
      }
      
      if (bestMatchIndex >= 0) break;
    }
    
    // If no match found, return the beginning of the content
    if (bestMatchIndex < 0) {
      return content.length > maxLength 
        ? `${content.substring(0, maxLength)}...` 
        : content;
    }
    
    // Calculate snippet range
    const startIndex = Math.max(0, bestMatchIndex - surroundingWords);
    const endIndex = Math.min(words.length, bestMatchIndex + surroundingWords + 1);
    
    // Create the snippet
    const snippetWords = words.slice(startIndex, endIndex);
    let snippet = snippetWords.join(' ');
    
    // Add ellipses if needed
    if (startIndex > 0) snippet = `...${snippet}`;
    if (endIndex < words.length) snippet = `${snippet}...`;
    
    // If snippet is too long, trim it
    if (snippet.length > maxLength) {
      snippet = `${snippet.substring(0, maxLength)}...`;
    }
    
    return snippet;
  } catch (error) {
    logger.error('Error extracting snippet', { error: error.message });
    return content.length > maxLength 
      ? `${content.substring(0, maxLength)}...` 
      : content;
  }
};

/**
 * Format a search result with highlights and snippets
 * 
 * @param {Object} item - Search result item
 * @param {string} contentType - Type of content
 * @param {string} query - Search query
 * @param {Object} config - Content type configuration
 * @returns {Promise<Object>} - Formatted result with highlights
 */
exports.formatResultWithHighlights = async (item, contentType, query, config) => {
  try {
    const result = item.toJSON ? item.toJSON() : item;
    
    // Generate URL based on content type
    const url = `/${contentType}/${result.id}`;
    
    // Fields to check for content to highlight
    const contentFields = config.fields.filter(field => 
      result[field] && typeof result[field] === 'string'
    );
    
    // Initialize fields
    let title = result[config.titleField] || '';
    let preview = '';
    let highlightedField = '';
    let snippet = '';
    
    // If we have a title field, try to highlight it
    if (title) {
      title = await exports.generateHighlight(title, query, {
        maxWords: 20,
        minWords: 5,
        maxFragments: 1
      });
    }
    
    // Find best field for snippet based on query match
    if (contentFields.length > 0) {
      // First try description or content fields
      const descField = contentFields.find(field => 
        field.includes('description') || field.includes('content')
      );
      
      if (descField && result[descField]) {
        highlightedField = descField;
        preview = await exports.generateHighlight(result[descField], query);
        snippet = exports.extractSnippet(result[descField], query);
      } 
      // If no description field found, use the first available field
      else {
        highlightedField = contentFields[0];
        preview = await exports.generateHighlight(result[contentFields[0]], query);
        snippet = exports.extractSnippet(result[contentFields[0]], query);
      }
    }
    
    return {
      id: result.id,
      title,
      contentType,
      date: result[config.dateField],
      preview,
      snippet,
      highlightedField,
      url,
      // Include relevance score if available
      relevance: result.relevance || null,
      // Add content type specific data
      data: result
    };
  } catch (error) {
    logger.error('Error formatting result with highlights', { error: error.message });
    
    // Fallback to simple formatting
    return {
      id: item.id,
      title: item[config.titleField],
      contentType,
      date: item[config.dateField],
      preview: item.description || item.content || '',
      url: `/${contentType}/${item.id}`,
      data: item
    };
  }
}; 