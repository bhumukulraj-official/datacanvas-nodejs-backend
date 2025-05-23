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
}

module.exports = new ProjectController(); 