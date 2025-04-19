const { Project, User } = require('../../../shared/database/models');
const { NotFoundError } = require('../../../shared/errors');
const cache = require('../../../shared/utils/cache');
const logger = require('../../../shared/utils/logger');
const { Op } = require('sequelize');

/**
 * Get all projects with pagination and optional filtering
 */
const getProjects = async (page = 1, limit = 10, sort = 'createdAt', order = 'desc', tags = []) => {
  const offset = (page - 1) * limit;
  
  const query = {
    limit,
    offset,
    order: [[sort, order.toUpperCase()]],
    include: [
      {
        model: User,
        as: 'author',
        attributes: ['id', 'name', 'email']
      }
    ],
    attributes: [
      'id', 'title', 'description', 'thumbnail', 'tags', 
      'technologies', 'githubUrl', 'liveUrl', 'createdAt', 'updatedAt'
    ]
  };
  
  // Add tags filter if provided
  if (tags && tags.length > 0) {
    query.where = {
      tags: {
        [Op.overlap]: tags
      }
    };
  }
  
  const { rows, count } = await Project.findAndCountAll(query);
  
  return {
    projects: rows,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      totalItems: count,
      itemsPerPage: limit,
      hasNextPage: page < Math.ceil(count / limit),
      hasPreviousPage: page > 1
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
        as: 'author',
        attributes: ['id', 'name', 'email']
      }
    ]
  });
  
  if (!project) {
    throw new NotFoundError('Project not found');
  }
  
  return project;
};

/**
 * Create a new project
 */
const createProject = async (projectData) => {
  try {
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
    
    if (project.userId !== userId) {
      throw new Error('You do not have permission to update this project');
    }
    
    await project.update(projectData);
    
    // Invalidate related caches
    await cache.delByPattern('projects:list:*');
    await cache.del(`projects:${id}`);
    
    logger.info(`Project updated: ${id}`);
    
    return project;
  } catch (error) {
    logger.error(`Error updating project: ${error.message}`, { id, projectData });
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
    
    if (project.userId !== userId) {
      throw new Error('You do not have permission to delete this project');
    }
    
    await project.destroy();
    
    // Invalidate related caches
    await cache.delByPattern('projects:list:*');
    await cache.del(`projects:${id}`);
    
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

exports.createProject = createProject;
exports.updateProject = updateProject;
exports.deleteProject = deleteProject; 