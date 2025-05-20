const BaseRepository = require('../BaseRepository');
const { Message } = require('../../models');
const { Op } = require('sequelize');

class MessageRepository extends BaseRepository {
  constructor() {
    super(Message);
  }

  async getConversation(senderId, receiverId, projectId = null) {
    const where = {
      [Op.or]: [
        { sender_id: senderId, receiver_id: receiverId },
        { sender_id: receiverId, receiver_id: senderId }
      ]
    };

    if (projectId) where.project_id = projectId;

    return this.model.findAll({
      where,
      order: [['created_at', 'ASC']],
      include: ['attachments']
    });
  }
}

module.exports = MessageRepository; 