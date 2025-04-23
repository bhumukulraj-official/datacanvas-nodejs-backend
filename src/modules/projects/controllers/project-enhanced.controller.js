const projectEnhancedService = require('../services/project-enhanced.service');
const { NotFoundError, PermissionError, ConflictError } = require('../../../shared/errors');

/**
 * Search projects
 */
exports.searchProjects = async (req, res, next) => {
  try {
    const { 
      query, 
      page = 1, 
      limit = 10, 
      sort = 'created_at', 
      order = 'desc' 
    } = req.query;
    
    const result = await projectEnhancedService.searchProjects(
      query,
      parseInt(page),
      parseInt(limit),
      sort,
      order
    );
    
    return res.status(200).json({
      success: true,
      data: {
        projects: result.rows,
        pagination: {
          total: result.count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(result.count / parseInt(limit))
        }
      },
      message: 'Projects search results',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get project statistics
 */
exports.getProjectStatistics = async (req, res, next) => {
  try {
    const statistics = await projectEnhancedService.getProjectStatistics();
    
    return res.status(200).json({
      success: true,
      data: statistics,
      message: 'Project statistics retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get projects with advanced filtering
 */
exports.advancedFilterProjects = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sort = 'created_at', 
      order = 'desc',
      ...filters 
    } = req.query;
    
    const result = await projectEnhancedService.advancedFilterProjects(
      filters,
      parseInt(page),
      parseInt(limit),
      sort,
      order
    );
    
    return res.status(200).json({
      success: true,
      data: {
        projects: result.rows,
        pagination: {
          total: result.count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(result.count / parseInt(limit))
        }
      },
      message: 'Filtered projects retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get related projects
 */
exports.getRelatedProjects = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 5 } = req.query;
    
    const relatedProjects = await projectEnhancedService.getRelatedProjects(
      parseInt(id),
      parseInt(limit)
    );
    
    return res.status(200).json({
      success: true,
      data: relatedProjects,
      message: 'Related projects retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return next(error);
    }
    next(error);
  }
};

/**
 * Export project data
 */
exports.exportProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { format = 'json' } = req.query;
    
    const exportData = await projectEnhancedService.exportProject(
      parseInt(id),
      format.toLowerCase()
    );
    
    if (format.toLowerCase() === 'json') {
      return res.status(200).json({
        success: true,
        data: exportData,
        message: 'Project exported successfully',
        timestamp: new Date().toISOString()
      });
    } else if (format.toLowerCase() === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="project-${id}.csv"`);
      return res.status(200).send(exportData);
    } else {
      return next(new ConflictError('Unsupported export format'));
    }
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ConflictError) {
      return next(error);
    }
    next(error);
  }
};

/**
 * Manage featured project status
 */
exports.manageFeaturedProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { featured, displayOrder } = req.body;
    
    // Check admin permissions
    if (req.user.role !== 'admin') {
      return next(new PermissionError('Only admins can manage featured projects'));
    }
    
    const project = await projectEnhancedService.manageFeaturedProject(
      parseInt(id),
      featured,
      displayOrder !== undefined ? parseInt(displayOrder) : null
    );
    
    return res.status(200).json({
      success: true,
      data: project,
      message: featured 
        ? 'Project marked as featured' 
        : 'Project removed from featured',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return next(error);
    }
    next(error);
  }
}; 