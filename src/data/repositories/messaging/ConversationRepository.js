const BaseRepository = require('../BaseRepository');
const { Conversation, Message, ConversationParticipant } = require('../../models');
const { Op } = require('sequelize');

class ConversationRepository extends BaseRepository {
  constructor() {
    super(Conversation);
  }

  async findByUuid(uuid) {
    return this.model.findOne({ where: { uuid } });
  }

  async getParticipantConversations(userId) {
    return this.model.findAll({
      include: [
        {
          model: ConversationParticipant,
          where: { 
            user_id: userId,
            is_deleted: false
          }
        },
        {
          model: Message,
          as: 'lastMessage'
        }
      ],
      where: { is_deleted: false },
      order: [['last_message_at', 'DESC']]
    });
  }

  async getWithMessages(conversationId) {
    return this.model.findOne({
      where: { id: conversationId, is_deleted: false },
      include: [
        {
          model: Message,
          where: { is_deleted: false },
          order: [['created_at', 'ASC']],
          include: ['attachments']
        },
        {
          model: ConversationParticipant,
          where: { is_deleted: false }
        }
      ]
    });
  }

  async updateLastMessage(conversationId, messageId, messageDate) {
    return this.model.update({
      last_message_id: messageId,
      last_message_at: messageDate
    }, {
      where: { id: conversationId }
    });
  }
}

module.exports = ConversationRepository; 