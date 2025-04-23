/**
 * Search Service
 * Handles business logic for search operations
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

/**
 * Map of content types to their respective models and searchable fields
 */
const CONTENT_TYPE_MAP = {
  projects: {
    model: Project,
    fields: ['title', 'description', 'tech_stack', 'keywords'],
    titleField: 'title',
    dateField: 'created_at'
  },
  blog: {
    model: BlogPost,
    fields: ['title', 'content', 'summary', 'tags'],
    titleField: 'title',
    dateField: 'published_at'
  },
  skills: {
    model: Skill,
    fields: ['name', 'description', 'category'],
    titleField: 'name',
    dateField: 'created_at'
  },
  experience: {
    model: Experience,
    fields: ['title', 'company', 'description', 'technologies'],
    titleField: 'title',
    dateField: 'start_date'
  },
  education: {
    model: Education,
    fields: ['institution', 'degree', 'field_of_study', 'description'],
    titleField: 'institution',
    dateField: 'start_date'
  },
  testimonials: {
    model: Testimonial,
    fields: ['author_name', 'company', 'content'],
    titleField: 'author_name',
    dateField: 'created_at'
  }
};

/**
 * Formats search results to a consistent structure
 */
const formatSearchResults = (results, contentType) => {
  return results.map(result => {
    const item = result.toJSON();
    const config = CONTENT_TYPE_MAP[contentType];
    
    return {
      id: item.id,
      title: item[config.titleField],
      contentType,
      date: item[config.dateField],
      preview: item.description || item.content || item.summary || '',
      // Add content type specific data
      data: item
    };
  });
};

// Cache key prefix for search results
const SEARCH_CACHE_KEY_PREFIX = 'search:';

/**
 * Perform a global search across all content types
 */
exports.globalSearch = async (query, options = {}) => {
  const { types = [], limit = 20, offset = 0, userId } = options;
  
  // Generate cache key
  const cacheKey = `${SEARCH_CACHE_KEY_PREFIX}${query}:${types.join(',')}:${limit}:${offset}:${userId || 'public'}`;
  
  // Try to get from cache first
  const cachedResults = await redis.get(cacheKey);
  if (cachedResults) {
    return JSON.parse(cachedResults);
  }
  
  // If no specific types provided, search all types
  const searchTypes = types.length > 0 ? types : [
    'projects', 
    'blog', 
    'education', 
    'experience', 
    'skills', 
    'testimonials'
  ];
  
  // Initialize results object
  const results = {
    total: 0,
    items: []
  };
  
  // Search in Projects
  if (searchTypes.includes('projects')) {
    const projectResults = await Project.findAll({
      where: {
        [Op.or]: [
          { title: { [Op.iLike]: `%${query}%` } },
          { description: { [Op.iLike]: `%${query}%` } },
          { tags: { [Op.contains]: [query] } }
        ],
        ...(userId ? { user_id: userId } : {}),
        status: 'published' // Only return published projects
      },
      limit,
      attributes: ['id', 'title', 'description', 'thumbnail_url', 'created_at'],
      order: [
        [sequelize.literal(`(
          CASE 
            WHEN title ILIKE '%${query}%' THEN 1 
            WHEN description ILIKE '%${query}%' THEN 2
            ELSE 3 
          END
        )`), 'ASC'],
        ['created_at', 'DESC']
      ]
    });
    
    results.items.push(...projectResults.map(project => ({
      id: project.id,
      type: 'project',
      title: project.title,
      description: project.description,
      thumbnail: project.thumbnail_url,
      date: project.created_at,
      url: `/projects/${project.id}`
    })));
  }
  
  // Search in Blog posts
  if (searchTypes.includes('blog')) {
    const blogResults = await BlogPost.findAll({
      where: {
        [Op.or]: [
          { title: { [Op.iLike]: `%${query}%` } },
          { content: { [Op.iLike]: `%${query}%` } },
          { tags: { [Op.contains]: [query] } }
        ],
        ...(userId ? { user_id: userId } : {}),
        status: 'published' // Only return published posts
      },
      limit,
      attributes: ['id', 'title', 'excerpt', 'featured_image', 'created_at'],
      order: [
        [sequelize.literal(`(
          CASE 
            WHEN title ILIKE '%${query}%' THEN 1 
            WHEN content ILIKE '%${query}%' THEN 2
            ELSE 3 
          END
        )`), 'ASC'],
        ['created_at', 'DESC']
      ]
    });
    
    results.items.push(...blogResults.map(post => ({
      id: post.id,
      type: 'blog',
      title: post.title,
      description: post.excerpt,
      thumbnail: post.featured_image,
      date: post.created_at,
      url: `/blog/${post.id}`
    })));
  }
  
  // Search in Education
  if (searchTypes.includes('education')) {
    const educationResults = await Education.findAll({
      where: {
        [Op.or]: [
          { institution: { [Op.iLike]: `%${query}%` } },
          { degree: { [Op.iLike]: `%${query}%` } },
          { field_of_study: { [Op.iLike]: `%${query}%` } },
          { description: { [Op.iLike]: `%${query}%` } }
        ],
        ...(userId ? { user_id: userId } : {})
      },
      limit,
      attributes: ['id', 'institution', 'degree', 'field_of_study', 'start_date', 'end_date'],
      order: [
        [sequelize.literal(`(
          CASE 
            WHEN institution ILIKE '%${query}%' THEN 1 
            WHEN degree ILIKE '%${query}%' THEN 2
            WHEN field_of_study ILIKE '%${query}%' THEN 3
            ELSE 4 
          END
        )`), 'ASC'],
        ['start_date', 'DESC']
      ]
    });
    
    results.items.push(...educationResults.map(edu => ({
      id: edu.id,
      type: 'education',
      title: `${edu.degree} at ${edu.institution}`,
      description: edu.field_of_study,
      date: edu.end_date || edu.start_date,
      url: `/education/${edu.id}`
    })));
  }
  
  // Search in Experience
  if (searchTypes.includes('experience')) {
    const experienceResults = await Experience.findAll({
      where: {
        [Op.or]: [
          { title: { [Op.iLike]: `%${query}%` } },
          { company: { [Op.iLike]: `%${query}%` } },
          { description: { [Op.iLike]: `%${query}%` } },
          { technologies: { [Op.contains]: [query] } }
        ],
        ...(userId ? { user_id: userId } : {})
      },
      limit,
      attributes: ['id', 'title', 'company', 'description', 'start_date', 'end_date'],
      order: [
        [sequelize.literal(`(
          CASE 
            WHEN title ILIKE '%${query}%' THEN 1 
            WHEN company ILIKE '%${query}%' THEN 2
            ELSE 3 
          END
        )`), 'ASC'],
        ['start_date', 'DESC']
      ]
    });
    
    results.items.push(...experienceResults.map(exp => ({
      id: exp.id,
      type: 'experience',
      title: `${exp.title} at ${exp.company}`,
      description: exp.description,
      date: exp.end_date || exp.start_date,
      url: `/experience/${exp.id}`
    })));
  }
  
  // Search in Skills
  if (searchTypes.includes('skills')) {
    const skillResults = await Skill.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: `%${query}%` } },
          { category: { [Op.iLike]: `%${query}%` } },
          { description: { [Op.iLike]: `%${query}%` } }
        ],
        ...(userId ? { user_id: userId } : {})
      },
      limit,
      attributes: ['id', 'name', 'category', 'description', 'proficiency', 'icon'],
      order: [
        [sequelize.literal(`(
          CASE 
            WHEN name ILIKE '%${query}%' THEN 1 
            WHEN category ILIKE '%${query}%' THEN 2
            ELSE 3 
          END
        )`), 'ASC'],
        ['proficiency', 'DESC']
      ]
    });
    
    results.items.push(...skillResults.map(skill => ({
      id: skill.id,
      type: 'skill',
      title: skill.name,
      description: skill.description,
      category: skill.category,
      icon: skill.icon,
      url: `/skills/${skill.id}`
    })));
  }
  
  // Search in Testimonials
  if (searchTypes.includes('testimonials')) {
    const testimonialResults = await Testimonial.findAll({
      where: {
        [Op.or]: [
          { author_name: { [Op.iLike]: `%${query}%` } },
          { company: { [Op.iLike]: `%${query}%` } },
          { content: { [Op.iLike]: `%${query}%` } }
        ],
        ...(userId ? { user_id: userId } : {}),
        status: 'approved' // Only return approved testimonials
      },
      limit,
      attributes: ['id', 'author_name', 'author_title', 'company', 'content', 'created_at'],
      order: [
        [sequelize.literal(`(
          CASE 
            WHEN author_name ILIKE '%${query}%' THEN 1 
            WHEN company ILIKE '%${query}%' THEN 2
            ELSE 3 
          END
        )`), 'ASC'],
        ['created_at', 'DESC']
      ]
    });
    
    results.items.push(...testimonialResults.map(testimonial => ({
      id: testimonial.id,
      type: 'testimonial',
      title: `${testimonial.author_name} - ${testimonial.author_title || testimonial.company || ''}`,
      description: testimonial.content,
      date: testimonial.created_at,
      url: `/testimonials/${testimonial.id}`
    })));
  }
  
  // Sort all results by relevance (type order) and date
  results.items.sort((a, b) => {
    // First sort by type priority
    const typeOrder = { project: 1, blog: 2, experience: 3, education: 4, skill: 5, testimonial: 6 };
    const typeComparison = typeOrder[a.type] - typeOrder[b.type];
    
    if (typeComparison !== 0) {
      return typeComparison;
    }
    
    // Then by date (if available)
    if (a.date && b.date) {
      return new Date(b.date) - new Date(a.date);
    }
    
    return 0;
  });
  
  // Apply pagination
  results.total = results.items.length;
  results.items = results.items.slice(offset, offset + limit);
  
  // Cache the results for 5 minutes
  await redis.set(cacheKey, JSON.stringify(results), 'EX', 300);
  
  return results;
};

/**
 * Search within a specific content type
 */
exports.searchByContentType = async (contentType, query, options = {}) => {
  const { limit = 25, offset = 0, sort = 'relevance', filters = {} } = options;
  
  // Validate content type
  if (!CONTENT_TYPE_MAP[contentType]) {
    throw new BadRequestError(`Invalid content type: ${contentType}`);
  }
  
  const { model, fields } = CONTENT_TYPE_MAP[contentType];
  
  // Build where clause for text search
  const orConditions = fields.map(field => ({
    [field]: {
      [Op.iLike]: `%${query}%`
    }
  }));
  
  const whereClause = { 
    [Op.or]: orConditions
  };
  
  // Add status filter for content types that have it
  if (['projects', 'blog', 'testimonials'].includes(contentType)) {
    whereClause.status = 'published';
  }
  
  // Add any additional filters
  if (Object.keys(filters).length > 0) {
    Object.entries(filters).forEach(([key, value]) => {
      whereClause[key] = value;
    });
  }
  
  // Get results
  const { count, rows } = await model.findAndCountAll({
    where: whereClause,
    limit,
    offset,
    order: getSortOrder(contentType, sort)
  });
  
  return {
    results: formatSearchResults(rows, contentType),
    metadata: {
      contentType,
      query,
      totalCount: count,
      limit,
      offset
    }
  };
};

/**
 * Determines the order clause based on sort parameter
 */
function getSortOrder(contentType, sort) {
  const config = CONTENT_TYPE_MAP[contentType];
  
  switch (sort) {
    case 'date':
      return [[config.dateField, 'DESC']];
    case 'title':
      return [[config.titleField, 'ASC']];
    case 'relevance':
    default:
      // For relevance, we would ideally use a full-text search function
      // Here we're using a simple fallback
      return [[sequelize.literal(`CASE WHEN ${config.titleField} ILIKE '%' || :query || '%' THEN 0 ELSE 1 END`), 'ASC']];
  }
} 