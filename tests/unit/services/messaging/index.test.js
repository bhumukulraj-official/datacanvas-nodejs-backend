const messagingServices = require('../../../../src/services/messaging');

describe('Messaging Services Index', () => {
  test('should export all messaging services', () => {
    expect(messagingServices).toHaveProperty('ConversationService');
    expect(messagingServices).toHaveProperty('MessageService');
    expect(messagingServices).toHaveProperty('NotificationService');
    expect(messagingServices).toHaveProperty('WebsocketService');
  });

  test('should export services as objects', () => {
    expect(typeof messagingServices.ConversationService).toBe('object');
    expect(typeof messagingServices.MessageService).toBe('object');
    expect(typeof messagingServices.NotificationService).toBe('object');
    expect(typeof messagingServices.WebsocketService).toBe('object');
  });
}); 