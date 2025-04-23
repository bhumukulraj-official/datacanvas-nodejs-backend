const Project = require('../models/Project');
const { ConflictError } = require('../../../shared/errors');

/**
 * Validate project status transitions
 * This middleware emulates the behavior of a database trigger
 * to validate status transitions without changing the database schema
 */
exports.validateStatusTransition = async (req, res, next) => {
  try {
    if (!req.body.status || !req.params.id) {
      return next();
    }
    
    const projectId = parseInt(req.params.id);
    const newStatus = req.body.status;
    
    const project = await Project.findByPk(projectId);
    if (!project) {
      return next();
    }
    
    const currentStatus = project.status;
    
    // Define valid status transitions
    const validTransitions = {
      'draft': ['in_progress', 'archived'],
      'in_progress': ['completed', 'archived', 'draft'],
      'completed': ['archived', 'in_progress'],
      'archived': ['draft', 'in_progress']
    };
    
    // Check if transition is valid
    if (currentStatus !== newStatus && !validTransitions[currentStatus]?.includes(newStatus)) {
      throw new ConflictError(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Normalize project status to use a single enum format
 * This helps address the issue with duplicate ENUMs in the database
 */
exports.normalizeProjectStatus = (req, res, next) => {
  try {
    // Map potential values to the correct enum values
    const statusMap = {
      'draft': 'draft',
      'in_progress': 'in_progress',
      'inprogress': 'in_progress',
      'in progress': 'in_progress',
      'completed': 'completed',
      'complete': 'completed',
      'done': 'completed',
      'finished': 'completed',
      'archived': 'archived',
      'archive': 'archived'
    };
    
    if (req.body.status) {
      const normalizedStatus = statusMap[req.body.status.toLowerCase()];
      if (normalizedStatus) {
        req.body.status = normalizedStatus;
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
}; 