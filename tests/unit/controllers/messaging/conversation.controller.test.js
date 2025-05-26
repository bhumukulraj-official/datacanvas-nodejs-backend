const conversationController = require('../../../../src/api/controllers/messaging/conversation.controller');
const { ConversationService } = require('../../../../src/services/messaging');

// Mock the ConversationService
jest.mock('../../../../src/services/messaging/conversation.service', () => ({
  createConversation: jest.fn(),
  getConversationDetails: jest.fn(),
  getUserConversations: jest.fn(),
  updateLastRead: jest.fn()
}));

describe('ConversationController', () => {
  let mockReq;
  let mockRes;
  let mockNext;
  
  beforeEach(() => {
    // Mock request, response, and next
    mockReq = {
      user: { id: 'user-123' },
      params: {
        id: 'conversation-123'
      },
      body: {
        participants: ['user-456', 'user-789'],
        projectId: 'project-123',
        messageId: 'message-123'
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

  describe('createConversation', () => {
    test('should create a conversation successfully', async () => {
      const mockConversation = {
        id: 'conversation-123',
        creator_id: 'user-123',
        participants: ['user-123', 'user-456', 'user-789'],
        project_id: 'project-123'
      };
      
      // Mock the createConversation service method
      ConversationService.createConversation.mockResolvedValue(mockConversation);
      
      await conversationController.createConversation(mockReq, mockRes, mockNext);
      
      expect(ConversationService.createConversation).toHaveBeenCalledWith(
        mockReq.user.id,
        mockReq.body.participants,
        mockReq.body.projectId
      );
      
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockConversation
      });
    });
    
    test('should call next with error on failure', async () => {
      const mockError = new Error('Failed to create conversation');
      
      // Mock the createConversation service method to throw an error
      ConversationService.createConversation.mockRejectedValue(mockError);
      
      await conversationController.createConversation(mockReq, mockRes, mockNext);
      
      expect(ConversationService.createConversation).toHaveBeenCalledWith(
        mockReq.user.id,
        mockReq.body.participants,
        mockReq.body.projectId
      );
      
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('getConversation', () => {
    test('should get conversation details', async () => {
      const mockConversation = {
        id: 'conversation-123',
        creator_id: 'user-123',
        participants: ['user-123', 'user-456', 'user-789'],
        project_id: 'project-123',
        messages: []
      };
      
      // Mock the getConversationDetails service method
      ConversationService.getConversationDetails.mockResolvedValue(mockConversation);
      
      await conversationController.getConversation(mockReq, mockRes, mockNext);
      
      expect(ConversationService.getConversationDetails).toHaveBeenCalledWith(
        mockReq.params.id
      );
      
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockConversation
      });
    });
    
    test('should call next with error on failure', async () => {
      const mockError = new Error('Failed to get conversation');
      
      // Mock the getConversationDetails service method to throw an error
      ConversationService.getConversationDetails.mockRejectedValue(mockError);
      
      await conversationController.getConversation(mockReq, mockRes, mockNext);
      
      expect(ConversationService.getConversationDetails).toHaveBeenCalledWith(
        mockReq.params.id
      );
      
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('getUserConversations', () => {
    test('should get user conversations', async () => {
      const mockConversations = [
        { id: 'conversation-1', creator_id: 'user-123' },
        { id: 'conversation-2', creator_id: 'user-456' }
      ];
      
      // Mock the getUserConversations service method
      ConversationService.getUserConversations.mockResolvedValue(mockConversations);
      
      await conversationController.getUserConversations(mockReq, mockRes, mockNext);
      
      expect(ConversationService.getUserConversations).toHaveBeenCalledWith(
        mockReq.user.id
      );
      
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockConversations
      });
    });
    
    test('should call next with error on failure', async () => {
      const mockError = new Error('Failed to get user conversations');
      
      // Mock the getUserConversations service method to throw an error
      ConversationService.getUserConversations.mockRejectedValue(mockError);
      
      await conversationController.getUserConversations(mockReq, mockRes, mockNext);
      
      expect(ConversationService.getUserConversations).toHaveBeenCalledWith(
        mockReq.user.id
      );
      
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('updateLastRead', () => {
    test('should update last read message', async () => {
      const mockConversation = {
        id: 'conversation-123',
        last_read_message_id: 'message-123'
      };
      
      // Mock the updateLastRead service method
      ConversationService.updateLastRead.mockResolvedValue(mockConversation);
      
      await conversationController.updateLastRead(mockReq, mockRes, mockNext);
      
      expect(ConversationService.updateLastRead).toHaveBeenCalledWith(
        mockReq.user.id,
        mockReq.params.id,
        mockReq.body.messageId
      );
      
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockConversation
      });
    });
    
    test('should call next with error on failure', async () => {
      const mockError = new Error('Failed to update last read');
      
      // Mock the updateLastRead service method to throw an error
      ConversationService.updateLastRead.mockRejectedValue(mockError);
      
      await conversationController.updateLastRead(mockReq, mockRes, mockNext);
      
      expect(ConversationService.updateLastRead).toHaveBeenCalledWith(
        mockReq.user.id,
        mockReq.params.id,
        mockReq.body.messageId
      );
      
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });
}); 