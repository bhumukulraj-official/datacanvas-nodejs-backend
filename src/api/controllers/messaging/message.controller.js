const { MessageService } = require('../../../services/messaging');
const { authenticate } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validation.middleware');
const { schemas } = require('../../../utils/validation.util');

class MessageController {
  async sendMessage(req, res, next) {
    try {
      const message = await MessageService.sendMessage(
        req.user.id,
        req.params.conversationId,
        req.body.content,
        req.body.attachments
      );
      res.status(201).json({
        success: true,
        data: message
      });
    } catch (error) {
      next(error);
    }
  }

  async getMessage(req, res, next) {
    try {
      const message = await MessageService.getMessageWithAttachments(
        req.params.messageId
      );
      res.json({
        success: true,
        data: message
      });
    } catch (error) {
      next(error);
    }
  }

  async getConversationHistory(req, res, next) {
    try {
      const messages = await MessageService.getConversationHistory(
        req.params.conversationId,
        req.user.id
      );
      res.json({
        success: true,
        data: messages
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MessageController(); 