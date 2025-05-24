const BaseRepository = require('../BaseRepository');
const { ProjectClientAssignment } = require('../../models');
const { CustomError } = require('../../../utils/error.util');
const logger = require('../../../utils/logger.util');

class ProjectClientAssignmentRepository extends BaseRepository {
  constructor() {
    super(ProjectClientAssignment);
    logger.info('Initializing ProjectClientAssignmentRepository');
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