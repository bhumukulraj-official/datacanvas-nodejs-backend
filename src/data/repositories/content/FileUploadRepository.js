const BaseRepository = require('../BaseRepository');
const { FileUpload } = require('../../models');
const { Op } = require('sequelize');
const { CustomError } = require('../../../utils/error.util');
const logger = require('../../../utils/logger.util');

class FileUploadRepository extends BaseRepository {
  constructor() {
    super(FileUpload);
    logger.info('FileUploadRepository initialized');
  }

  async getByUuid(uuid) {
    return this.model.findOne({ where: { uuid } });
  }

  async getByEntityTypeAndId(entityType, entityId) {
    return this.model.findAll({
      where: { 
        entity_type: entityType,
        entity_id: entityId,
        is_deleted: false
      }
    });
  }

  async getPublicFiles() {
    return this.model.findAll({
      where: { 
        is_public: true,
        is_deleted: false 
      }
    });
  }

  async getByUserId(userId) {
    return this.model.findAll({
      where: {
        user_id: userId,
        is_deleted: false
      }
    });
  }

  async getByFileType(mimeType) {
    return this.model.findAll({
      where: {
        mime_type: {
          [Op.like]: `${mimeType}%`
        },
        is_deleted: false
      }
    });
  }

  async markAsDeleted(fileId) {
    return this.update(fileId, { is_deleted: true });
  }

  async updateVirusScanStatus(fileId, status) {
    return this.update(fileId, { virus_scan_status: status });
  }

  async create(fileData) {
    try {
      return await super.create(fileData);
    } catch (error) {
      logger.error('Error creating file upload:', error);
      throw new CustomError('Database error creating file record', 500);
    }
  }
}

module.exports = FileUploadRepository; 