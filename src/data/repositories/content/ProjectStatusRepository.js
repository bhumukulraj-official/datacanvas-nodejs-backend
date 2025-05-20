const BaseRepository = require('../BaseRepository');
const { ProjectStatus } = require('../../models');

class ProjectStatusRepository extends BaseRepository {
  constructor() {
    super(ProjectStatus);
  }

  async findByCode(code) {
    return this.model.findOne({ where: { code } });
  }

  async getActiveStatuses() {
    return this.model.findAll({ where: { is_active: true } });
  }
}

module.exports = ProjectStatusRepository; 