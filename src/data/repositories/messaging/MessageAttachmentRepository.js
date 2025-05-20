const BaseRepository = require('../BaseRepository');
const { MessageAttachment } = require('../../models');
const { Op } = require('sequelize');

class MessageAttachmentRepository extends BaseRepository {
  constructor() {
    super(MessageAttachment);
  }

  async getByMessage(messageId) {
    return this.model.findAll({ where: { message_id: messageId } });
  }

  async getLargeAttachments(sizeThreshold) {
    return this.model.findAll({
      where: {
        file_size: {
          [Op.gt]: sizeThreshold
        }
      }
    });
  }

  async getByMimeType(mimeType) {
    return this.model.findAll({
      where: { file_type: mimeType }
    });
  }
}

module.exports = MessageAttachmentRepository; 