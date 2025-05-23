const express = require('express');
const router = express.Router();
const {
  ConversationController,
  MessageController,
  NotificationController,
  WebsocketController
} = require('../../controllers/messaging');
const { authenticate } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validation.middleware');
const { schemas } = require('../../../utils/validation.util');

// Authenticate all messaging routes
router.use(authenticate);

// Conversation routes
router.post('/conversations',
  validate(schemas.messaging.conversation.create, 'body'),
  ConversationController.createConversation
);
router.get('/conversations', ConversationController.getUserConversations);
router.get('/conversations/:id', ConversationController.getConversation);
router.put('/conversations/:id/read',
  validate(schemas.messaging.conversation.updateRead, 'body'),
  ConversationController.updateLastRead
);

// Message routes
router.post('/conversations/:conversationId/messages',
  validate(schemas.messaging.message.create, 'body'),
  MessageController.sendMessage
);
router.get('/conversations/:conversationId/messages', MessageController.getConversationHistory);
router.get('/messages/:messageId', MessageController.getMessage);

// Notification routes
router.get('/notifications', NotificationController.getNotifications);
router.put('/notifications/:notificationId/read', NotificationController.markAsRead);
router.delete('/notifications', NotificationController.clearNotifications);

// Websocket routes
router.get('/websocket/:connectionId/messages', WebsocketController.getConnectionMessages);

module.exports = router; 