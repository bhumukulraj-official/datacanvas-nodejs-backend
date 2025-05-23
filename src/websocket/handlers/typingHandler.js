const { ConversationRepository } = require('../../data/repositories/messaging');

async function handleTypingIndicator(user, message, ws) {
  const participants = await ConversationRepository.getConversationParticipants(
    message.conversationId
  );
  
  participants.forEach(participant => {
    if (participant.id !== user.id) {
      ws.send(JSON.stringify({
        type: 'typing_indicator',
        conversationId: message.conversationId,
        userId: user.id,
        isTyping: message.isTyping
      }));
    }
  });
}

module.exports = { handleTypingIndicator }; 