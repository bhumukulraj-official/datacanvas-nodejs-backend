const { ProjectService } = require('../../../services/content');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validation.middleware');
const { schemas } = require('../../../utils/validation.util');

class ProjectController {
  async createProject(req, res, next) {
    try {
      const project = await ProjectService.createProject({
        ...req.body,
        owner_id: req.user.id
      });
      res.status(201).json({
        success: true,
        data: project
      });
    } catch (error) {
      next(error);
    }
  }

  async getProject(req, res, next) {
    try {
      const project = await ProjectService.getProjectById(req.params.id);
      res.json({
        success: true,
        data: project
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProject(req, res, next) {
    try {
      const project = await ProjectService.updateProject(
        req.params.id,
        req.body
      );
      res.json({
        success: true,
        data: project
      });
    } catch (error) {
      next(error);
    }
  }

  async getFeaturedProjects(req, res, next) {
    try {
      const projects = await ProjectService.getFeaturedProjects();
      res.json({
        success: true,
        data: projects
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllProjects(req, res, next) {
    try {
      const projects = await ProjectService.getAllProjects();
      res.json({
        success: true,
        data: projects
      });
    } catch (error) {
      next(error);
    }
  }

  // Project Updates methods

  async createProjectUpdate(req, res, next) {
    try {
      const update = await ProjectService.createProjectUpdate(
        req.params.projectId,
        {
          ...req.body,
          author_id: req.user.id
        }
      );
      res.status(201).json({
        success: true,
        data: update
      });
    } catch (error) {
      next(error);
    }
  }

  async getProjectUpdates(req, res, next) {
    try {
      const updates = await ProjectService.getProjectUpdates(req.params.projectId);
      res.json({
        success: true,
        data: updates
      });
    } catch (error) {
      next(error);
    }
  }

  async getProjectUpdate(req, res, next) {
    try {
      const update = await ProjectService.getProjectUpdateById(
        req.params.projectId,
        req.params.updateId
      );
      res.json({
        success: true,
        data: update
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProjectUpdate(req, res, next) {
    try {
      const update = await ProjectService.updateProjectUpdate(
        req.params.projectId,
        req.params.updateId,
        req.body
      );
      res.json({
        success: true,
        data: update
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteProjectUpdate(req, res, next) {
    try {
      await ProjectService.deleteProjectUpdate(
        req.params.projectId,
        req.params.updateId
      );
      res.json({
        success: true,
        message: 'Project update deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProjectController(); 