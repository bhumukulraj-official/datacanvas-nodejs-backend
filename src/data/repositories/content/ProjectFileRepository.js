const BaseRepository = require('../BaseRepository');
const { ProjectFile } = require('../../models');
const { Op } = require('sequelize');
const { CustomError } = require('../../../utils/error.util');
const logger = require('../../../utils/logger.util');

class ProjectFileRepository extends BaseRepository {
  constructor() {
    super(ProjectFile);
    logger.info('Initializing ProjectFileRepository');
  }

  async getLatestVersions(projectId) {
    return this.model.findAll({
      where: { project_id: projectId },
      order: [['version', 'DESC']],
      group: ['filename']
    });
  }

  async getByFileType(fileType) {
    return this.model.findAll({
      where: {
        file_type: {
          [Op.iLike]: `%${fileType}%`
        }
      }
    });
  }

  async getByUploader(userId) {
    return this.model.findAll({
      where: { uploaded_by: userId },
      include: ['project']
    });
  }
}

module.exports = ProjectFileRepository; 