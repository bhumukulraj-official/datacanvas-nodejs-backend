/**
 * Search Facets Service
 * Provides methods for generating and processing faceted search
 */
const { Op } = require('sequelize');
const sequelize = require('../../../shared/database');
const logger = require('../../../shared/utils/logger');
const { CONTENT_TYPE_MAP } = require('./search-config');

/**
 * Generate facet aggregations for a specific content type
 * 
 * @param {string} contentType - Type of content to generate facets for
 * @param {Object} searchResults - Base search results to generate facets from
 * @param {Object} options - Additional options for facet generation
 * @returns {Promise<Object>} - Generated facets
 */
exports.generateFacets = async (contentType, searchCondition, options = {}) => {
  const config = CONTENT_TYPE_MAP[contentType];
  if (!config) {
    logger.error(`Invalid content type for facet generation: ${contentType}`);
    return {};
  }
  
  const facets = {};
  const { limit = 10 } = options;
  
  try {
    // Generate facets based on content type
    switch (contentType) {
      case 'projects':
        // Generate tech stack facets
        facets.techStack = await generateArrayFacet(
          config.model,
          'tech_stack',
          searchCondition,
          limit
        );
        break;
        
      case 'blog':
        // Generate tag facets
        facets.tags = await generateArrayFacet(
          config.model,
          'tags',
          searchCondition,
          limit
        );
        // Generate category facets
        facets.categories = await generateCategoryFacet(
          config.model,
          'category_id',
          searchCondition,
          limit
        );
        break;
        
      case 'skills':
        // Generate category facets
        facets.categories = await generateStringFacet(
          config.model,
          'category',
          searchCondition,
          limit
        );
        break;
        
      case 'experience':
        // Generate company facets
        facets.companies = await generateStringFacet(
          config.model,
          'company',
          searchCondition,
          limit
        );
        break;
        
      case 'education':
        // Generate institution facets
        facets.institutions = await generateStringFacet(
          config.model,
          'institution',
          searchCondition,
          limit
        );
        break;
        
      case 'testimonials':
        // Generate company facets
        facets.companies = await generateStringFacet(
          config.model,
          'company',
          searchCondition,
          limit
        );
        break;
        
      default:
        break;
    }
    
    // Add date facets for all content types
    if (config.dateField) {
      facets.dates = await generateDateFacets(
        config.model,
        config.dateField,
        searchCondition
      );
    }
    
    return facets;
  } catch (error) {
    logger.error(`Error generating facets for ${contentType}`, { error: error.message });
    return {};
  }
};

/**
 * Generate facets for string fields
 */
async function generateStringFacet(model, field, searchCondition, limit) {
  try {
    const results = await model.findAll({
      attributes: [
        [field, 'value'],
        [sequelize.fn('COUNT', sequelize.col(field)), 'count']
      ],
      where: {
        ...searchCondition,
        [field]: {
          [Op.not]: null,
          [Op.ne]: ''
        }
      },
      group: [field],
      order: [[sequelize.literal('count'), 'DESC']],
      limit
    });
    
    return results.map(result => ({
      value: result.getDataValue('value'),
      count: parseInt(result.getDataValue('count')),
      filter: result.getDataValue('value')
    }));
  } catch (error) {
    logger.error(`Error generating string facet for ${field}`, { error: error.message });
    return [];
  }
}

/**
 * Generate facets for array fields (like tags or tech stack)
 */
async function generateArrayFacet(model, field, searchCondition, limit) {
  try {
    // For PostgreSQL array fields
    const query = `
      SELECT 
        unnest(${field}) as value, 
        COUNT(*) as count
      FROM ${model.tableName}
      WHERE ${field} IS NOT NULL
      ${searchCondition ? `AND ${buildWhereClauseSQL(searchCondition)}` : ''}
      GROUP BY value
      ORDER BY count DESC
      LIMIT ${limit}
    `;
    
    const results = await sequelize.query(query, { 
      type: sequelize.QueryTypes.SELECT
    });
    
    return results.map(row => ({
      value: row.value,
      count: parseInt(row.count),
      filter: row.value
    }));
  } catch (error) {
    logger.error(`Error generating array facet for ${field}`, { error: error.message });
    return [];
  }
}

/**
 * Generate facets for foreign key fields (like category)
 */
async function generateCategoryFacet(model, field, searchCondition, limit) {
  try {
    const results = await model.findAll({
      attributes: [
        [field, 'categoryId'],
        [sequelize.fn('COUNT', sequelize.col(field)), 'count']
      ],
      where: {
        ...searchCondition,
        [field]: {
          [Op.not]: null
        }
      },
      include: [{
        model: sequelize.models.BlogCategory,
        as: 'category',
        attributes: ['id', 'name', 'slug']
      }],
      group: [field, 'category.id', 'category.name', 'category.slug'],
      order: [[sequelize.literal('count'), 'DESC']],
      limit
    });
    
    return results.map(result => {
      const category = result.category || {};
      return {
        value: category.name || `Category ${result.getDataValue('categoryId')}`,
        count: parseInt(result.getDataValue('count')),
        filter: result.getDataValue('categoryId'),
        data: category
      };
    });
  } catch (error) {
    logger.error(`Error generating category facet for ${field}`, { error: error.message });
    return [];
  }
}

/**
 * Generate date range facets
 */
async function generateDateFacets(model, dateField, searchCondition) {
  try {
    // Define date ranges
    const dateRanges = [
      { name: 'Last 7 days', sql: `${dateField} >= NOW() - INTERVAL '7 days'` },
      { name: 'Last 30 days', sql: `${dateField} >= NOW() - INTERVAL '30 days'` },
      { name: 'Last 90 days', sql: `${dateField} >= NOW() - INTERVAL '90 days'` },
      { name: 'Last year', sql: `${dateField} >= NOW() - INTERVAL '1 year'` },
      { name: 'Older', sql: `${dateField} < NOW() - INTERVAL '1 year'` }
    ];
    
    const results = [];
    
    for (const range of dateRanges) {
      const query = `
        SELECT COUNT(*) as count
        FROM ${model.tableName}
        WHERE ${dateField} IS NOT NULL
        ${searchCondition ? `AND ${buildWhereClauseSQL(searchCondition)}` : ''}
        AND ${range.sql}
      `;
      
      const [countResult] = await sequelize.query(query, { 
        type: sequelize.QueryTypes.SELECT
      });
      
      const count = parseInt(countResult.count);
      
      if (count > 0) {
        results.push({
          value: range.name,
          count,
          filter: range.sql
        });
      }
    }
    
    return results;
  } catch (error) {
    logger.error(`Error generating date facets for ${dateField}`, { error: error.message });
    return [];
  }
}

/**
 * Helper to build a SQL WHERE clause from a Sequelize condition
 */
function buildWhereClauseSQL(condition) {
  try {
    // This is a simplified approach, for complex conditions you'd need more sophisticated conversion
    const clauses = [];
    
    // Process simple equality conditions
    for (const [key, value] of Object.entries(condition)) {
      if (typeof value === 'object' && value !== null) {
        if (value[Op.eq] !== undefined) {
          clauses.push(`${key} = '${value[Op.eq]}'`);
        } else if (value[Op.in] !== undefined) {
          const values = value[Op.in].map(v => `'${v}'`).join(', ');
          clauses.push(`${key} IN (${values})`);
        } else if (value[Op.like] !== undefined) {
          clauses.push(`${key} LIKE '${value[Op.like]}'`);
        } else if (value[Op.gte] !== undefined) {
          clauses.push(`${key} >= '${value[Op.gte]}'`);
        } else if (value[Op.lte] !== undefined) {
          clauses.push(`${key} <= '${value[Op.lte]}'`);
        }
      } else {
        clauses.push(`${key} = '${value}'`);
      }
    }
    
    return clauses.join(' AND ');
  } catch (error) {
    logger.error('Error building WHERE clause SQL', { error: error.message });
    return '1=1'; // Safe default
  }
}

/**
 * Parse filter parameters for faceted search
 * 
 * @param {Object} filters - Filter parameters from request
 * @param {string} contentType - Content type being filtered
 * @returns {Object} - Parsed filters ready for database query
 */
exports.parseFilters = (filters, contentType) => {
  const config = CONTENT_TYPE_MAP[contentType];
  if (!config) return {};
  
  const parsedFilters = {};
  
  try {
    // Handle different types of filters based on content type
    if (filters.dates) {
      // Date filter is a SQL fragment, handled separately
      parsedFilters.dateFilter = filters.dates;
    }
    
    // Parse content type specific filters
    switch (contentType) {
      case 'projects':
        if (filters.techStack) {
          parsedFilters.tech_stack = { [Op.contains]: Array.isArray(filters.techStack) ? filters.techStack : [filters.techStack] };
        }
        if (filters.status) {
          parsedFilters.status = filters.status;
        }
        break;
        
      case 'blog':
        if (filters.tags) {
          parsedFilters.tags = { [Op.overlap]: Array.isArray(filters.tags) ? filters.tags : [filters.tags] };
        }
        if (filters.category) {
          parsedFilters.category_id = filters.category;
        }
        break;
        
      case 'skills':
        if (filters.categories) {
          parsedFilters.category = filters.categories;
        }
        break;
        
      case 'experience':
        if (filters.companies) {
          parsedFilters.company = filters.companies;
        }
        break;
        
      case 'education':
        if (filters.institutions) {
          parsedFilters.institution = filters.institutions;
        }
        break;
        
      case 'testimonials':
        if (filters.companies) {
          parsedFilters.company = filters.companies;
        }
        break;
    }
    
    return parsedFilters;
  } catch (error) {
    logger.error(`Error parsing filters for ${contentType}`, { error: error.message, filters });
    return {};
  }
}; 