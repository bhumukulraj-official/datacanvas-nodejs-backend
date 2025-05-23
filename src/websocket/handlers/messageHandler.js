const { MessageService } = require('../../services/messaging');
const { NotificationService } = require('../../services/messaging');

async function handleMessage(user, message, ws) {
  try {
    const sentMessage = await MessageService.sendMessage(
      user.id,
      message.conversationId,
      message.content,
      message.attachments
    );

    // Broadcast to conversation participants
    ws.send(JSON.stringify({
      type: 'message_ack',
      status: 'delivered',
      messageId: sentMessage.id
    }));

    // Create and send notifications
    const notification = await NotificationService.createNotification(
      sentMessage.conversationId,
      'new_message',
      {
        messageId: sentMessage.id,
        senderId: user.id
      }
    );

    ws.send(JSON.stringify({
      type: 'notification',
      ...notification
    }));
  } catch (error) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to send message',
      error: error.message
    }));
  }
}

module.exports = { handleMessage }; 