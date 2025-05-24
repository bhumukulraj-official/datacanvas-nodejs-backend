const { ProjectRepository } = require('../../data/repositories/content');
const { ProjectStatusRepository } = require('../../data/repositories/content');
const { TagRepository } = require('../../data/repositories/content');
const { CustomError, ResourceNotFoundError } = require('../../utils/error.util');
const logger = require('../../utils/logger.util');

class ProjectService {
  constructor() {
    try {
      this.projectRepo = new ProjectRepository();
      this.statusRepo = new ProjectStatusRepository();
      this.tagRepo = new TagRepository();
      logger.info('ProjectService initialized with repositories');
      logger.debug('Repositories loaded:', {
        projectRepo: !!this.projectRepo,
        statusRepo: !!this.statusRepo,
        tagRepo: !!this.tagRepo
      });
    } catch (error) {
      logger.error('Error initializing ProjectService repositories:', error);
      throw error;
    }
  }

  async createProject(projectData) {
    const status = await this.statusRepo.findByCode('draft');
    return this.projectRepo.create({
      ...projectData,
      project_status_id: status.id
    });
  }

  async getProjectById(id) {
    const project = await this.projectRepo.findById(id);
    if (!project) {
      throw new ResourceNotFoundError('Project', id);
    }
    return this._enrichProject(project);
  }

  async updateProject(id, updateData) {
    const [affectedCount] = await this.projectRepo.update(id, updateData);
    if (affectedCount === 0) {
      throw new ResourceNotFoundError('Project', id);
    }
    return this.getProjectById(id);
  }

  async getFeaturedProjects() {
    const projects = await this.projectRepo.getFeaturedProjects();
    return Promise.all(projects.map(p => this._enrichProject(p)));
  }

  async changeProjectStatus(projectId, statusCode) {
    const status = await this.statusRepo.findByCode(statusCode);
    if (!status) {
      throw new CustomError('Invalid project status', 400);
    }
    
    return this.projectRepo.update(projectId, { project_status_id: status.id });
  }

  async _enrichProject(project) {
    const status = await this.statusRepo.findById(project.project_status_id);
    return { ...project.get({ plain: true }, status) };
  }
}

module.exports = new ProjectService(); 