const BaseRepository = require('../BaseRepository');
const { ProjectClientAssignment } = require('../../models');

class ProjectClientAssignmentRepository extends BaseRepository {
  constructor() {
    super(ProjectClientAssignment);
  }

  async getActiveAssignments(projectId) {
    return this.model.findAll({
      where: { project_id: projectId, is_active: true },
      include: ['client']
    });
  }

  async getActiveByProject(projectId) {
    return this.model.findAll({
      where: { project_id: projectId, is_active: true },
      include: ['client']
    });
  }

  async deactivateAssignment(assignmentId) {
    return this.update(assignmentId, { 
      is_active: false,
      end_date: new Date()
    });
  }
}

module.exports = ProjectClientAssignmentRepository; 