const { MessageRepository, MessageAttachmentRepository } = require('../../../data/repositories/messaging');
const { CustomError } = require('../../utils/error.util');

class MessageService {
  constructor() {
    this.messageRepo = new MessageRepository();
    this.attachmentRepo = new MessageAttachmentRepository();
  }

  async sendMessage(senderId, convoId, content, attachments = []) {
    const message = await this.messageRepo.create({
      sender_id: senderId,
      conversation_id: convoId,
      content
    });

    if (attachments.length > 0) {
      await this.attachmentRepo.bulkCreate(
        attachments.map(a => ({ ...a, message_id: message.id }))
      );
    }

    await this.convoRepo.updateLastMessage(convoId, message.id, new Date());
    return this.getMessageWithAttachments(message.id);
  }

  async getMessageWithAttachments(messageId) {
    const message = await this.messageRepo.findById(messageId, {
      include: ['attachments']
    });
    if (!message) {
      throw new CustomError('Message not found', 404);
    }
    return message;
  }

  async getConversationHistory(convoId, userId) {
    await this.participantRepo.updateLastReadMessage(convoId, userId);
    return this.messageRepo.getConversation(convoId);
  }
}

module.exports = new MessageService(); 