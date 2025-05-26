const conversationService = require('../../../../src/services/messaging/conversation.service');
const { ConversationRepository, ConversationParticipantRepository } = require('../../../../src/data/repositories/messaging');
const { ResourceNotFoundError } = require('../../../../src/utils/error.util');

// Mock the repositories
jest.mock('../../../../src/data/repositories/messaging', () => ({
  ConversationRepository: jest.fn(),
  ConversationParticipantRepository: jest.fn()
}));

describe('ConversationService', () => {
  let mockConversationRepository;
  let mockParticipantRepository;
  
  beforeEach(() => {
    // Create new instances of mocked repositories
    mockConversationRepository = new ConversationRepository();
    mockParticipantRepository = new ConversationParticipantRepository();
    
    // Reset mock implementations
    jest.clearAllMocks();
    
    // Mock repositories on the service
    conversationService.convoRepo = mockConversationRepository;
    conversationService.participantRepo = mockParticipantRepository;
  });

  describe('createConversation', () => {
    test('should create a new conversation with participants', async () => {
      // Mock conversation creation
      const mockConversation = {
        id: 1,
        created_by: 123,
        project_id: 456,
        created_at: new Date()
      };
      
      mockConversationRepository.create = jest.fn().mockResolvedValue(mockConversation);
      
      // Mock participant creation
      mockParticipantRepository.bulkCreate = jest.fn().mockResolvedValue([
        { id: 1, user_id: 123, conversation_id: 1 },
        { id: 2, user_id: 456, conversation_id: 1 }
      ]);
      
      // Mock conversation details
      const mockConversationDetails = {
        ...mockConversation,
        participants: [
          { id: 1, user_id: 123, conversation_id: 1 },
          { id: 2, user_id: 456, conversation_id: 1 }
        ],
        messages: []
      };
      
      // Mock getConversationDetails
      const getConversationDetailsSpy = jest.spyOn(conversationService, 'getConversationDetails')
        .mockResolvedValue(mockConversationDetails);
      
      // Call the service method
      const result = await conversationService.createConversation(123, [456], 456);
      
      // Assertions
      expect(mockConversationRepository.create).toHaveBeenCalledWith({
        created_by: 123,
        project_id: 456
      });
      
      expect(mockParticipantRepository.bulkCreate).toHaveBeenCalledWith([
        { user_id: 123, conversation_id: 1 },
        { user_id: 456, conversation_id: 1 }
      ]);
      
      expect(getConversationDetailsSpy).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockConversationDetails);
      
      // Restore the spy
      getConversationDetailsSpy.mockRestore();
    });
  });

  describe('getConversationDetails', () => {
    test('should return conversation details', async () => {
      // Mock getWithMessages
      const mockConversation = {
        id: 1,
        created_by: 123,
        project_id: 456,
        created_at: new Date(),
        participants: [
          { id: 1, user_id: 123, conversation_id: 1 },
          { id: 2, user_id: 456, conversation_id: 1 }
        ],
        messages: [
          { id: 1, sender_id: 123, content: 'Hello', created_at: new Date() }
        ]
      };
      
      mockConversationRepository.getWithMessages = jest.fn().mockResolvedValue(mockConversation);
      
      // Call the service method
      const result = await conversationService.getConversationDetails(1);
      
      // Assertions
      expect(mockConversationRepository.getWithMessages).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockConversation);
    });
    
    test('should throw error if conversation not found', async () => {
      mockConversationRepository.getWithMessages = jest.fn().mockResolvedValue(null);
      
      // Call the service method and expect it to throw
      await expect(
        conversationService.getConversationDetails(999)
      ).rejects.toThrow(ResourceNotFoundError);
      
      // Assertions
      expect(mockConversationRepository.getWithMessages).toHaveBeenCalledWith(999);
    });
  });

  describe('getUserConversations', () => {
    test('should return user conversations', async () => {
      // Mock user conversations
      const mockConversations = [
        {
          id: 1,
          created_by: 123,
          project_id: 456,
          created_at: new Date(),
          participants: [
            { id: 1, user_id: 123, conversation_id: 1 },
            { id: 2, user_id: 456, conversation_id: 1 }
          ],
          lastMessage: {
            id: 1,
            content: 'Hello',
            created_at: new Date()
          }
        }
      ];
      
      mockConversationRepository.getParticipantConversations = jest.fn().mockResolvedValue(mockConversations);
      
      // Call the service method
      const result = await conversationService.getUserConversations(123);
      
      // Assertions
      expect(mockConversationRepository.getParticipantConversations).toHaveBeenCalledWith(123);
      expect(result).toEqual(mockConversations);
    });
  });

  describe('updateLastRead', () => {
    test('should update last read message', async () => {
      // Mock update
      mockParticipantRepository.updateLastReadMessage = jest.fn().mockResolvedValue([1]);
      
      // Mock conversation details
      const mockConversation = {
        id: 1,
        created_by: 123,
        project_id: 456,
        created_at: new Date(),
        participants: [
          { id: 1, user_id: 123, conversation_id: 1, last_read_message_id: 2 },
          { id: 2, user_id: 456, conversation_id: 1 }
        ],
        messages: [
          { id: 1, sender_id: 123, content: 'Hello', created_at: new Date() },
          { id: 2, sender_id: 456, content: 'Hi there', created_at: new Date() }
        ]
      };
      
      // Mock getConversationDetails
      const getConversationDetailsSpy = jest.spyOn(conversationService, 'getConversationDetails')
        .mockResolvedValue(mockConversation);
      
      // Call the service method
      const result = await conversationService.updateLastRead(123, 1, 2);
      
      // Assertions
      expect(mockParticipantRepository.updateLastReadMessage).toHaveBeenCalledWith(1, 123, 2);
      expect(getConversationDetailsSpy).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockConversation);
      
      // Restore the spy
      getConversationDetailsSpy.mockRestore();
    });
  });
}); 