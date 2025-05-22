const BaseRepository = require('../BaseRepository');
const { ProjectVisibility, Project } = require('../../models');

class ProjectVisibilityRepository extends BaseRepository {
  constructor() {
    super(ProjectVisibility);
  }

  async getByProjectId(projectId) {
    return this.model.findOne({
      where: { project_id: projectId }
    });
  }

  async setVisibilityLevel(projectId, visibilityLevel) {
    const existingRecord = await this.getByProjectId(projectId);
    
    if (existingRecord) {
      return this.update(existingRecord.id, { visibility_level: visibilityLevel });
    } else {
      return this.create({
        project_id: projectId,
        visibility_level: visibilityLevel
      });
    }
  }

  async updateClientExceptions(projectId, clientExceptions) {
    const existingRecord = await this.getByProjectId(projectId);
    
    if (existingRecord) {
      return this.update(existingRecord.id, { client_exceptions: clientExceptions });
    }
    
    return null;
  }

  async addClientException(projectId, clientId, accessType) {
    const record = await this.getByProjectId(projectId);
    
    if (!record) return null;
    
    const clientExceptions = record.client_exceptions || {};
    clientExceptions[clientId] = accessType;
    
    return this.update(record.id, { client_exceptions: clientExceptions });
  }

  async removeClientException(projectId, clientId) {
    const record = await this.getByProjectId(projectId);
    
    if (!record || !record.client_exceptions) return null;
    
    const clientExceptions = { ...record.client_exceptions };
    delete clientExceptions[clientId];
    
    return this.update(record.id, { client_exceptions: clientExceptions });
  }
}

module.exports = ProjectVisibilityRepository; 