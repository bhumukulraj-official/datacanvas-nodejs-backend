const messageController = require('../../../../src/api/controllers/messaging/message.controller');
const { MessageService } = require('../../../../src/services/messaging');

// Mock the MessageService
jest.mock('../../../../src/services/messaging/message.service', () => ({
  sendMessage: jest.fn(),
  getMessageWithAttachments: jest.fn(),
  getConversationHistory: jest.fn()
}));

describe('MessageController', () => {
  let mockReq;
  let mockRes;
  let mockNext;
  
  beforeEach(() => {
    // Mock request, response, and next
    mockReq = {
      user: { id: 'user-123' },
      params: {
        conversationId: 'conversation-123',
        messageId: 'message-123'
      },
      body: {
        content: 'Hello world',
        attachments: []
      }
    };
    
    mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    test('should send a message successfully', async () => {
      const mockMessage = {
        id: 'message-123',
        content: 'Hello world',
        sender_id: 'user-123',
        conversation_id: 'conversation-123'
      };
      
      // Mock the sendMessage service method
      MessageService.sendMessage.mockResolvedValue(mockMessage);
      
      await messageController.sendMessage(mockReq, mockRes, mockNext);
      
      expect(MessageService.sendMessage).toHaveBeenCalledWith(
        mockReq.user.id,
        mockReq.params.conversationId,
        mockReq.body.content,
        mockReq.body.attachments
      );
      
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockMessage
      });
    });
    
    test('should call next with error on failure', async () => {
      const mockError = new Error('Failed to send message');
      
      // Mock the sendMessage service method to throw an error
      MessageService.sendMessage.mockRejectedValue(mockError);
      
      await messageController.sendMessage(mockReq, mockRes, mockNext);
      
      expect(MessageService.sendMessage).toHaveBeenCalledWith(
        mockReq.user.id,
        mockReq.params.conversationId,
        mockReq.body.content,
        mockReq.body.attachments
      );
      
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('getMessage', () => {
    test('should get a message with attachments', async () => {
      const mockMessage = {
        id: 'message-123',
        content: 'Hello world',
        sender_id: 'user-123',
        conversation_id: 'conversation-123',
        attachments: []
      };
      
      // Mock the getMessageWithAttachments service method
      MessageService.getMessageWithAttachments.mockResolvedValue(mockMessage);
      
      await messageController.getMessage(mockReq, mockRes, mockNext);
      
      expect(MessageService.getMessageWithAttachments).toHaveBeenCalledWith(
        mockReq.params.messageId
      );
      
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockMessage
      });
    });
    
    test('should call next with error on failure', async () => {
      const mockError = new Error('Failed to get message');
      
      // Mock the getMessageWithAttachments service method to throw an error
      MessageService.getMessageWithAttachments.mockRejectedValue(mockError);
      
      await messageController.getMessage(mockReq, mockRes, mockNext);
      
      expect(MessageService.getMessageWithAttachments).toHaveBeenCalledWith(
        mockReq.params.messageId
      );
      
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('getConversationHistory', () => {
    test('should get conversation history', async () => {
      const mockMessages = [
        { id: 'message-1', content: 'Hello', sender_id: 'user-123' },
        { id: 'message-2', content: 'World', sender_id: 'user-456' }
      ];
      
      // Mock the getConversationHistory service method
      MessageService.getConversationHistory.mockResolvedValue(mockMessages);
      
      await messageController.getConversationHistory(mockReq, mockRes, mockNext);
      
      expect(MessageService.getConversationHistory).toHaveBeenCalledWith(
        mockReq.params.conversationId,
        mockReq.user.id
      );
      
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockMessages
      });
    });
    
    test('should call next with error on failure', async () => {
      const mockError = new Error('Failed to get conversation history');
      
      // Mock the getConversationHistory service method to throw an error
      MessageService.getConversationHistory.mockRejectedValue(mockError);
      
      await messageController.getConversationHistory(mockReq, mockRes, mockNext);
      
      expect(MessageService.getConversationHistory).toHaveBeenCalledWith(
        mockReq.params.conversationId,
        mockReq.user.id
      );
      
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });
}); 