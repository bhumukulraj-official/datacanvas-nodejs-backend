const { Op, Sequelize } = require('sequelize');
const Project = require('../models/Project');
const { redisGet, redisSet } = require('../../../shared/database');
const { ConflictError, NotFoundError } = require('../../../shared/errors');

/**
 * Enhanced search functionality for projects
 * @param {string} query Search query
 * @param {number} page Page number
 * @param {number} limit Items per page
 * @param {string} sort Field to sort by
 * @param {string} order Sort order (asc/desc)
 * @returns {Promise<{rows: Project[], count: number}>}
 */
exports.searchProjects = async (query, page = 1, limit = 10, sort = 'created_at', order = 'desc') => {
  const offset = (page - 1) * limit;
  
  // Convert query to search terms
  const searchTerms = query.split(' ').filter(term => term.length > 2);
  
  // Search across multiple fields
  const searchConditions = searchTerms.map(term => ({
    [Op.or]: [
      { title: { [Op.iLike]: `%${term}%` } },
      { description: { [Op.iLike]: `%${term}%` } },
      { tags: { [Op.iLike]: `%${term}%` } },
      { technologies: { [Op.iLike]: `%${term}%` } },
      { meta_title: { [Op.iLike]: `%${term}%` } },
      { meta_description: { [Op.iLike]: `%${term}%` } }
    ]
  }));
  
  const whereCondition = searchTerms.length > 0 
    ? { [Op.and]: searchConditions }
    : {};
  
  const { rows, count } = await Project.findAndCountAll({
    where: whereCondition,
    order: [[sort, order.toUpperCase()]],
    limit,
    offset
  });
  
  return { rows, count };
};

/**
 * Get project statistics
 * @returns {Promise<Object>} Statistics about projects
 */
exports.getProjectStatistics = async () => {
  const cacheKey = 'project:statistics';
  const cachedStats = await redisGet(cacheKey);
  
  if (cachedStats) {
    return JSON.parse(cachedStats);
  }
  
  // Count by status
  const statusCounts = await Project.findAll({
    attributes: [
      'status',
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
    ],
    group: ['status']
  });
  
  // Count by featured
  const featuredCount = await Project.count({
    where: { is_featured: true }
  });
  
  // Get technology distribution
  const projects = await Project.findAll({
    attributes: ['technologies']
  });
  
  const technologyCount = {};
  projects.forEach(project => {
    const techs = project.technologies || [];
    techs.forEach(tech => {
      technologyCount[tech] = (technologyCount[tech] || 0) + 1;
    });
  });
  
  // Get tag distribution
  const tagCount = {};
  projects.forEach(project => {
    const tags = project.tags || [];
    tags.forEach(tag => {
      tagCount[tag] = (tagCount[tag] || 0) + 1;
    });
  });
  
  const statistics = {
    totalProjects: await Project.count(),
    byStatus: statusCounts.reduce((acc, item) => {
      acc[item.status] = parseInt(item.getDataValue('count'));
      return acc;
    }, {}),
    featuredCount,
    technologyDistribution: Object.entries(technologyCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .reduce((acc, [tech, count]) => {
        acc[tech] = count;
        return acc;
      }, {}),
    tagDistribution: Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .reduce((acc, [tag, count]) => {
        acc[tag] = count;
        return acc;
      }, {})
  };
  
  // Cache for 1 hour
  await redisSet(cacheKey, JSON.stringify(statistics), 3600);
  
  return statistics;
};

/**
 * Advanced filtering for projects
 * @param {Object} filters Advanced filter options
 * @param {number} page Page number
 * @param {number} limit Items per page
 * @param {string} sort Field to sort by
 * @param {string} order Sort order (asc/desc)
 * @returns {Promise<{rows: Project[], count: number}>}
 */
exports.advancedFilterProjects = async (filters, page = 1, limit = 10, sort = 'created_at', order = 'desc') => {
  const offset = (page - 1) * limit;
  const where = {};
  
  // Process filters
  if (filters.status) {
    where.status = filters.status;
  }
  
  if (filters.featured !== undefined) {
    where.is_featured = Boolean(filters.featured);
  }
  
  if (filters.technologies && filters.technologies.length) {
    where.technologies = {
      [Op.overlap]: Array.isArray(filters.technologies) 
        ? filters.technologies
        : [filters.technologies]
    };
  }
  
  if (filters.tags && filters.tags.length) {
    where.tags = {
      [Op.overlap]: Array.isArray(filters.tags) 
        ? filters.tags 
        : [filters.tags]
    };
  }
  
  if (filters.startDateFrom) {
    where.start_date = { ...where.start_date, [Op.gte]: new Date(filters.startDateFrom) };
  }
  
  if (filters.startDateTo) {
    where.start_date = { ...where.start_date, [Op.lte]: new Date(filters.startDateTo) };
  }
  
  if (filters.endDateFrom) {
    where.end_date = { ...where.end_date, [Op.gte]: new Date(filters.endDateFrom) };
  }
  
  if (filters.endDateTo) {
    where.end_date = { ...where.end_date, [Op.lte]: new Date(filters.endDateTo) };
  }
  
  if (filters.hasGithub !== undefined) {
    where.github_url = filters.hasGithub 
      ? { [Op.ne]: null } 
      : null;
  }
  
  if (filters.hasLiveUrl !== undefined) {
    where.live_url = filters.hasLiveUrl 
      ? { [Op.ne]: null } 
      : null;
  }
  
  const { rows, count } = await Project.findAndCountAll({
    where,
    order: [[sort, order.toUpperCase()]],
    limit,
    offset
  });
  
  return { rows, count };
};

/**
 * Get related projects based on tags or technologies
 * @param {number} projectId Current project ID 
 * @param {number} limit Maximum number of related projects
 * @returns {Promise<Project[]>}
 */
exports.getRelatedProjects = async (projectId, limit = 5) => {
  const cacheKey = `project:${projectId}:related`;
  const cachedRelated = await redisGet(cacheKey);
  
  if (cachedRelated) {
    return JSON.parse(cachedRelated);
  }
  
  const project = await Project.findByPk(projectId);
  if (!project) {
    throw new NotFoundError('Project not found');
  }
  
  const { tags, technologies } = project;
  
  // Find projects with similar tags or technologies
  const relatedProjects = await Project.findAll({
    where: {
      id: { [Op.ne]: projectId }, // Exclude current project
      [Op.or]: [
        { tags: { [Op.overlap]: tags } },
        { technologies: { [Op.overlap]: technologies } }
      ],
      status: 'completed' // Only include completed projects
    },
    order: [
      ['is_featured', 'DESC'],
      ['created_at', 'DESC']
    ],
    limit
  });
  
  // Cache for 1 day
  await redisSet(cacheKey, JSON.stringify(relatedProjects), 86400);
  
  return relatedProjects;
};

/**
 * Export project data
 * @param {number} projectId Project ID
 * @param {string} format Export format (json, csv)
 * @returns {Promise<Object|string>} Exported project data
 */
exports.exportProject = async (projectId, format = 'json') => {
  const project = await Project.findByPk(projectId);
  if (!project) {
    throw new NotFoundError('Project not found');
  }
  
  if (format === 'json') {
    return project.toJSON();
  } else if (format === 'csv') {
    const projectData = project.toJSON();
    // Convert to CSV format
    const fields = Object.keys(projectData);
    const header = fields.join(',');
    
    const values = fields.map(field => {
      const value = projectData[field];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      return `"${String(value).replace(/"/g, '""')}"`;
    });
    
    return `${header}\n${values.join(',')}`;
  } else {
    throw new ConflictError('Unsupported export format');
  }
};

/**
 * Manage featured projects
 * @param {number} projectId Project ID
 * @param {boolean} featured Featured status
 * @param {number} displayOrder Display order (optional)
 * @returns {Promise<Project>} Updated project
 */
exports.manageFeaturedProject = async (projectId, featured, displayOrder = null) => {
  const project = await Project.findByPk(projectId);
  if (!project) {
    throw new NotFoundError('Project not found');
  }
  
  const updates = { is_featured: Boolean(featured) };
  
  if (displayOrder !== null) {
    updates.display_order = displayOrder;
  }
  
  await project.update(updates);
  
  // Invalidate caches for featured projects
  await redisPublish('cache_invalidate', 'projects:featured');
  
  return project;
}; 