const BaseRepository = require('../BaseRepository');
const { Project } = require('../../models');
const sequelize = require('sequelize');

class ProjectRepository extends BaseRepository {
  constructor() {
    super(Project);
  }

  async getFeaturedProjects() {
    return this.model.findAll({
      where: { is_featured: true },
      order: [['created_at', 'DESC']]
    });
  }

  async getByVisibility(visibility, options = {}) {
    return this.model.findAll({
      where: { visibility },
      include: ['ProjectStatus'],
      ...options
    });
  }

  async getByCustomField(fieldName, fieldValue) {
    return this.model.findAll({
      where: sequelize.literal(`custom_fields ->> '${fieldName}' = '${fieldValue}'`)
    });
  }
}

module.exports = ProjectRepository; 