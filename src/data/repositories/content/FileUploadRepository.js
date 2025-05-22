const BaseRepository = require('../BaseRepository');
const { FileUpload } = require('../../models');
const { Op } = require('sequelize');

class FileUploadRepository extends BaseRepository {
  constructor() {
    super(FileUpload);
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
}

module.exports = FileUploadRepository; 