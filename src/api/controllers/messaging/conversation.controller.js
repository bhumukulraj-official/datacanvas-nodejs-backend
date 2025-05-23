const { ConversationService } = require('../../../services/messaging');
const { authenticate } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validation.middleware');
const { schemas } = require('../../../utils/validation.util');

class ConversationController {
  async createConversation(req, res, next) {
    try {
      const conversation = await ConversationService.createConversation(
        req.user.id,
        req.body.participants,
        req.body.projectId
      );
      res.status(201).json({
        success: true,
        data: conversation
      });
    } catch (error) {
      next(error);
    }
  }

  async getConversation(req, res, next) {
    try {
      const conversation = await ConversationService.getConversationDetails(
        req.params.id
      );
      res.json({
        success: true,
        data: conversation
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserConversations(req, res, next) {
    try {
      const conversations = await ConversationService.getUserConversations(
        req.user.id
      );
      res.json({
        success: true,
        data: conversations
      });
    } catch (error) {
      next(error);
    }
  }

  async updateLastRead(req, res, next) {
    try {
      const conversation = await ConversationService.updateLastRead(
        req.user.id,
        req.params.id,
        req.body.messageId
      );
      res.json({
        success: true,
        data: conversation
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ConversationController(); 