const BaseRepository = require('../BaseRepository');
const { ConversationParticipant } = require('../../models');
const { Op } = require('sequelize');

class ConversationParticipantRepository extends BaseRepository {
  constructor() {
    super(ConversationParticipant);
  }

  async getByConversation(conversationId) {
    return this.model.findAll({
      where: { 
        conversation_id: conversationId,
        is_deleted: false 
      }
    });
  }

  async getByUser(userId) {
    return this.model.findAll({
      where: { 
        user_id: userId,
        is_deleted: false 
      }
    });
  }

  async findParticipant(conversationId, userId) {
    return this.model.findOne({
      where: {
        conversation_id: conversationId,
        user_id: userId,
        is_deleted: false
      }
    });
  }

  async updateLastReadMessage(conversationId, userId, messageId) {
    return this.model.update(
      { last_read_message_id: messageId },
      {
        where: {
          conversation_id: conversationId,
          user_id: userId,
          is_deleted: false
        }
      }
    );
  }

  async toggleMute(conversationId, userId, isMuted) {
    return this.model.update(
      { is_muted: isMuted },
      {
        where: {
          conversation_id: conversationId,
          user_id: userId,
          is_deleted: false
        }
      }
    );
  }
}

module.exports = ConversationParticipantRepository; 