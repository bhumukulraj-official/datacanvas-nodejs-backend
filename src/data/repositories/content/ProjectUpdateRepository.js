const BaseRepository = require('../BaseRepository');
const { ProjectUpdate } = require('../../models');

class ProjectUpdateRepository extends BaseRepository {
  constructor() {
    super(ProjectUpdate);
  }

  async getUpdatesForProject(projectId, options = {}) {
    return this.model.findAll({
      where: { project_id: projectId },
      ...options
    });
  }

  async findByProjectId(projectId) {
    return this.model.findAll({
      where: { project_id: projectId },
      order: [['created_at', 'DESC']]
    });
  }

  async markAsViewed(updateId) {
    return this.update(updateId, { client_viewed_at: new Date() });
  }

  async getUnviewedUpdates(projectId) {
    return this.model.findAll({
      where: {
        project_id: projectId,
        client_viewed_at: null
      }
    });
  }

  async markAsNotified(updateId) {
    return this.update(updateId, {
      notified_at: new Date()
    });
  }
}

module.exports = ProjectUpdateRepository; 