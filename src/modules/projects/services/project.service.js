const { Project, User } = require('../../../shared/database/models');
const { NotFoundError, ConflictError } = require('../../../shared/errors');
const cache = require('../../../shared/utils/cache');
const logger = require('../../../shared/utils/logger');
const { Op } = require('sequelize');
const slugify = require('slugify');

/**
 * Get all projects with pagination and optional filtering
 */
const getProjects = async (page = 1, limit = 10, sort = 'created_at', order = 'desc', status = null, featured = null, tags = []) => {
  const offset = (page - 1) * limit;
  
  const query = {
    limit,
    offset,
    order: [[sort, order.toUpperCase()]],
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'email']
      }
    ],
    attributes: [
      'id', 'title', 'slug', 'description', 'thumbnail_url', 'tags', 
      'technologies', 'github_url', 'live_url', 'is_featured', 'display_order',
      'status', 'start_date', 'end_date', 'meta_title', 'meta_description',
      'created_at', 'updated_at'
    ],
    where: {
      deleted_at: null,
    }
  };
  
  // Add status filter if provided
  if (status) {
    query.where.status = status;
  }
  
  // Add featured filter if provided
  if (featured !== null) {
    query.where.is_featured = featured;
  }
  
  // Add tags filter if provided
  if (tags && tags.length > 0) {
    // Since tags are stored as JSON strings in the database, 
    // we need to use a more complex query
    const tagConditions = tags.map(tag => ({
      [Op.or]: [
        {
          tags: {
            [Op.like]: `%"${tag}"%`
          }
        }
      ]
    }));
    
    query.where = {
      ...query.where,
      [Op.and]: tagConditions
    };
  }
  
  const { rows, count } = await Project.findAndCountAll(query);
  
  return {
    projects: rows,
    pagination: {
      current_page: page,
      total_pages: Math.ceil(count / limit),
      total_items: count,
      items_per_page: limit,
      has_next_page: page < Math.ceil(count / limit),
      has_previous_page: page > 1
    }
  };
};

/**
 * Get a project by ID
 */
const getProjectById = async (id) => {
  const project = await Project.findByPk(id, {
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'email']
      }
    ],
    where: {
      deleted_at: null
    }
  });
  
  if (!project) {
    throw new NotFoundError('Project not found');
  }
  
  return project;
};

/**
 * Get a project by slug
 */
const getProjectBySlug = async (slug) => {
  const project = await Project.findOne({
    where: {
      slug,
      deleted_at: null
    },
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'email']
      }
    ]
  });
  
  if (!project) {
    throw new NotFoundError('Project not found');
  }
  
  return project;
};

/**
 * Check if a slug is already in use
 */
const isSlugUnique = async (slug, excludeId = null) => {
  const whereClause = {
    slug,
    deleted_at: null
  };
  
  if (excludeId) {
    whereClause.id = {
      [Op.ne]: excludeId
    };
  }
  
  const existingProject = await Project.findOne({
    where: whereClause
  });
  
  return !existingProject;
};

/**
 * Generate a unique slug based on title
 */
const generateUniqueSlug = async (title, existingId = null) => {
  let baseSlug = slugify(title, {
    lower: true,
    strict: true,
    trim: true
  });
  
  let slug = baseSlug;
  let counter = 1;
  
  // Check if the slug already exists
  while (!(await isSlugUnique(slug, existingId))) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
};

/**
 * Create a new project
 */
const createProject = async (projectData) => {
  try {
    // Ensure we have a unique slug
    if (!projectData.slug) {
      projectData.slug = await generateUniqueSlug(projectData.title);
    } else if (!(await isSlugUnique(projectData.slug))) {
      throw new ConflictError('A project with this slug already exists');
    }
    
    // Convert user_id to snake_case if provided in camelCase
    if (projectData.userId && !projectData.user_id) {
      projectData.user_id = projectData.userId;
      delete projectData.userId;
    }
    
    // Make sure tags and technologies are properly stored as JSON strings
    if (projectData.tags && Array.isArray(projectData.tags)) {
      projectData.tags = JSON.stringify(projectData.tags);
    }
    
    if (projectData.technologies && Array.isArray(projectData.technologies)) {
      projectData.technologies = JSON.stringify(projectData.technologies);
    }
    
    const project = await Project.create(projectData);
    
    // Invalidate cache for project lists
    await cache.delByPattern('projects:list:*');
    
    logger.info(`Project created: ${project.id}`);
    
    return project;
  } catch (error) {
    logger.error(`Error creating project: ${error.message}`, { projectData });
    throw error;
  }
};

/**
 * Update a project
 */
const updateProject = async (id, projectData, userId) => {
  try {
    const project = await Project.findByPk(id);
    
    if (!project) {
      throw new NotFoundError('Project not found');
    }
    
    if (project.user_id !== userId) {
      throw new Error('You do not have permission to update this project');
    }
    
    // Handle slug updates
    if (projectData.title && !projectData.slug) {
      // Generate a new slug if title was updated but slug wasn't provided
      projectData.slug = await generateUniqueSlug(projectData.title, id);
    } else if (projectData.slug && projectData.slug !== project.slug) {
      // Check if the new provided slug is unique
      if (!(await isSlugUnique(projectData.slug, id))) {
        throw new ConflictError('A project with this slug already exists');
      }
    }
    
    // Make sure tags and technologies are properly stored as JSON strings
    if (projectData.tags && Array.isArray(projectData.tags)) {
      projectData.tags = JSON.stringify(projectData.tags);
    }
    
    if (projectData.technologies && Array.isArray(projectData.technologies)) {
      projectData.technologies = JSON.stringify(projectData.technologies);
    }
    
    await project.update(projectData);
    
    // Invalidate related caches
    await cache.delByPattern('projects:list:*');
    await cache.del(`projects:${id}`);
    await cache.del(`projects:slug:${project.slug}`);
    
    logger.info(`Project updated: ${id}`);
    
    return project;
  } catch (error) {
    logger.error(`Error updating project: ${error.message}`, { id, projectData });
    throw error;
  }
};

/**
 * Update a project's status
 */
const updateProjectStatus = async (id, status, userId) => {
  try {
    const project = await Project.findByPk(id);
    
    if (!project) {
      throw new NotFoundError('Project not found');
    }
    
    if (project.user_id !== userId) {
      throw new Error('You do not have permission to update this project');
    }
    
    // Validate status transition
    const validTransitions = {
      'draft': ['draft', 'in_progress', 'archived'],
      'in_progress': ['in_progress', 'completed', 'archived'],
      'completed': ['completed', 'archived'],
      'archived': ['draft', 'in_progress']
    };
    
    if (!validTransitions[project.status].includes(status)) {
      throw new Error(`Invalid status transition from ${project.status} to ${status}`);
    }
    
    await project.update({ status });
    
    // Invalidate related caches
    await cache.delByPattern('projects:list:*');
    await cache.del(`projects:${id}`);
    await cache.del(`projects:slug:${project.slug}`);
    
    logger.info(`Project status updated: ${id} (${status})`);
    
    return project;
  } catch (error) {
    logger.error(`Error updating project status: ${error.message}`, { id, status });
    throw error;
  }
};

/**
 * Delete a project
 */
const deleteProject = async (id, userId) => {
  try {
    const project = await Project.findByPk(id);
    
    if (!project) {
      throw new NotFoundError('Project not found');
    }
    
    if (project.user_id !== userId) {
      throw new Error('You do not have permission to delete this project');
    }
    
    await project.destroy(); // This will use soft delete since paranoid is true
    
    // Invalidate related caches
    await cache.delByPattern('projects:list:*');
    await cache.del(`projects:${id}`);
    await cache.del(`projects:slug:${project.slug}`);
    
    logger.info(`Project deleted: ${id}`);
    
    return { success: true };
  } catch (error) {
    logger.error(`Error deleting project: ${error.message}`, { id });
    throw error;
  }
};

// Apply caching to methods that retrieve data
exports.getProjects = cache.cacheWrapper(
  getProjects,
  'projects:list',
  1800 // 30 minutes
);

exports.getProjectById = cache.cacheWrapper(
  getProjectById,
  'projects',
  1800 // 30 minutes
);

exports.getProjectBySlug = cache.cacheWrapper(
  getProjectBySlug,
  'projects:slug',
  1800 // 30 minutes
);

exports.createProject = createProject;
exports.updateProject = updateProject;
exports.updateProjectStatus = updateProjectStatus;
exports.deleteProject = deleteProject; 