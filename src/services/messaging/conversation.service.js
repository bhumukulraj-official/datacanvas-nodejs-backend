const { ConversationRepository } = require('../../data/repositories/messaging');
const { ConversationParticipantRepository } = require('../../data/repositories/messaging');
const { CustomError, ResourceNotFoundError } = require('../../utils/error.util');

class ConversationService {
  constructor() {
    this.convoRepo = new ConversationRepository();
    this.participantRepo = new ConversationParticipantRepository();
  }

  async createConversation(creatorId, participants, projectId = null) {
    const convo = await this.convoRepo.create({
      created_by: creatorId,
      project_id: projectId
    });

    await this.participantRepo.bulkCreate([
      { user_id: creatorId, conversation_id: convo.id },
      ...participants.map(p => ({ user_id: p, conversation_id: convo.id }))
    ]);

    return this.getConversationDetails(convo.id);
  }

  async getConversationDetails(convoId) {
    const convo = await this.convoRepo.getWithMessages(convoId);
    if (!convo) {
      throw new ResourceNotFoundError('Conversation', convoId);
    }
    return convo;
  }

  async getUserConversations(userId) {
    return this.convoRepo.getParticipantConversations(userId);
  }

  async updateLastRead(userId, convoId, messageId) {
    await this.participantRepo.updateLastReadMessage(convoId, userId, messageId);
    return this.getConversationDetails(convoId);
  }
}

module.exports = new ConversationService(); 