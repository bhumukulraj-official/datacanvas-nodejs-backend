const BaseRepository = require('../BaseRepository');
const { WebsocketMessage } = require('../../models');
const { Op } = require('sequelize');

class WebsocketMessageRepository extends BaseRepository {
  constructor() {
    super(WebsocketMessage);
  }

  async getByConnectionId(connectionId) {
    return this.model.findAll({
      where: { connection_id: connectionId },
      order: [['created_at', 'DESC']]
    });
  }

  async getByMessageId(messageId) {
    return this.model.findOne({
      where: { message_id: messageId }
    });
  }

  async getByMessageType(messageType) {
    return this.model.findAll({
      where: { message_type: messageType },
      order: [['created_at', 'DESC']]
    });
  }

  async getByDirection(connectionId, direction) {
    return this.model.findAll({
      where: {
        connection_id: connectionId,
        direction
      },
      order: [['created_at', 'DESC']]
    });
  }

  async updateStatus(messageId, status, errorDetails = null) {
    const updates = { status };
    
    if (errorDetails) {
      updates.error_details = errorDetails;
    }
    
    return this.model.update(updates, {
      where: { message_id: messageId }
    });
  }

  async getRecentMessages(limit = 100) {
    return this.model.findAll({
      order: [['created_at', 'DESC']],
      limit
    });
  }
}

module.exports = WebsocketMessageRepository; 