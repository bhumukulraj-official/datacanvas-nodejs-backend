const projectService = require('../services/project.service');
const { NotFoundError, PermissionError, ConflictError } = require('../../../shared/errors');

/**
 * Get all projects with pagination
 */
exports.listProjects = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sort = 'created_at', 
      order = 'desc', 
      status, 
      featured, 
      tags 
    } = req.query;
    
    const result = await projectService.getProjects(
      page, 
      limit, 
      sort, 
      order, 
      status, 
      featured !== undefined ? Boolean(featured) : null, 
      tags
    );
    
    return res.status(200).json({
      success: true,
      data: result,
      message: 'Projects retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a project by ID
 */
exports.getProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const project = await projectService.getProjectById(id);
    
    return res.status(200).json({
      success: true,
      data: project,
      message: 'Project retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a project by slug
 */
exports.getProjectBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    
    const project = await projectService.getProjectBySlug(slug);
    
    return res.status(200).json({
      success: true,
      data: project,
      message: 'Project retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new project
 */
exports.createProject = async (req, res, next) => {
  try {
    const projectData = req.body;
    projectData.user_id = req.user.id;
    
    const project = await projectService.createProject(projectData);
    
    return res.status(201).json({
      success: true,
      data: project,
      message: 'Project created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof ConflictError) {
      return next(error);
    }
    next(error);
  }
};

/**
 * Update a project
 */
exports.updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const projectData = req.body;
    const userId = req.user.id;
    
    const project = await projectService.updateProject(id, projectData, userId);
    
    return res.status(200).json({
      success: true,
      data: project,
      message: 'Project updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof ConflictError) {
      return next(error);
    }
    if (error.message === 'You do not have permission to update this project') {
      return next(new PermissionError('You do not have permission to update this project'));
    }
    next(error);
  }
};

/**
 * Update a project's status
 */
exports.updateProjectStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;
    
    const project = await projectService.updateProjectStatus(id, status, userId);
    
    return res.status(200).json({
      success: true,
      data: project,
      message: `Project status updated to ${status}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error.message === 'You do not have permission to update this project') {
      return next(new PermissionError('You do not have permission to update this project'));
    }
    if (error.message.startsWith('Invalid status transition')) {
      return next(new ConflictError(error.message));
    }
    next(error);
  }
};

/**
 * Delete a project
 */
exports.deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    await projectService.deleteProject(id, userId);
    
    return res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error.message === 'You do not have permission to delete this project') {
      return next(new PermissionError('You do not have permission to delete this project'));
    }
    next(error);
  }
}; 