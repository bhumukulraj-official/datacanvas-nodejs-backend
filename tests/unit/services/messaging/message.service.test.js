const messageService = require('../../../../src/services/messaging/message.service');
const {
  MessageRepository,
  MessageAttachmentRepository,
  ConversationRepository,
  ConversationParticipantRepository
} = require('../../../../src/data/repositories/messaging');
const { CustomError } = require('../../../../src/utils/error.util');

// Mock the repositories
jest.mock('../../../../src/data/repositories/messaging', () => ({
  MessageRepository: jest.fn(),
  MessageAttachmentRepository: jest.fn(),
  ConversationRepository: jest.fn(),
  ConversationParticipantRepository: jest.fn()
}));

describe('MessageService', () => {
  let mockMessageRepository;
  let mockAttachmentRepository;
  let mockConversationRepository;
  let mockParticipantRepository;
  
  beforeEach(() => {
    // Create new instances of mocked repositories
    mockMessageRepository = new MessageRepository();
    mockAttachmentRepository = new MessageAttachmentRepository();
    mockConversationRepository = new ConversationRepository();
    mockParticipantRepository = new ConversationParticipantRepository();
    
    // Reset mock implementations
    jest.clearAllMocks();
    
    // Add mock methods to repositories
    mockAttachmentRepository.bulkCreate = jest.fn();
    
    // Mock repositories on the service
    messageService.messageRepo = mockMessageRepository;
    messageService.attachmentRepo = mockAttachmentRepository;
    messageService.convoRepo = mockConversationRepository;
    messageService.participantRepo = mockParticipantRepository;
  });

  describe('sendMessage', () => {
    test('should send a message without attachments', async () => {
      // Mock message creation
      const mockMessage = {
        id: 1,
        sender_id: 123,
        conversation_id: 1,
        content: 'Hello, world!',
        created_at: new Date()
      };
      
      mockMessageRepository.create = jest.fn().mockResolvedValue(mockMessage);
      
      // Mock conversation update
      mockConversationRepository.updateLastMessage = jest.fn().mockResolvedValue([1]);
      
      // Mock get message with attachments
      const mockMessageWithAttachments = {
        ...mockMessage,
        attachments: []
      };
      
      const getMessageWithAttachmentsSpy = jest.spyOn(messageService, 'getMessageWithAttachments')
        .mockResolvedValue(mockMessageWithAttachments);
      
      // Call the service method
      const result = await messageService.sendMessage(
        123,
        1,
        'Hello, world!'
      );
      
      // Assertions
      expect(mockMessageRepository.create).toHaveBeenCalledWith({
        sender_id: 123,
        conversation_id: 1,
        content: 'Hello, world!'
      });
      
      expect(mockAttachmentRepository.bulkCreate).not.toHaveBeenCalled();
      
      expect(mockConversationRepository.updateLastMessage).toHaveBeenCalledWith(
        1,
        1,
        expect.any(Date)
      );
      
      expect(getMessageWithAttachmentsSpy).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockMessageWithAttachments);
      
      // Restore the spy
      getMessageWithAttachmentsSpy.mockRestore();
    });
    
    test('should send a message with attachments', async () => {
      // Mock message creation
      const mockMessage = {
        id: 1,
        sender_id: 123,
        conversation_id: 1,
        content: 'Check this out!',
        created_at: new Date()
      };
      
      mockMessageRepository.create = jest.fn().mockResolvedValue(mockMessage);
      
      // Mock attachments
      const attachments = [
        { file_id: 'file-1', file_name: 'document.pdf' },
        { file_id: 'file-2', file_name: 'image.jpg' }
      ];
      
      // Mock attachment creation
      const mockAttachments = [
        { id: 1, message_id: 1, file_id: 'file-1', file_name: 'document.pdf' },
        { id: 2, message_id: 1, file_id: 'file-2', file_name: 'image.jpg' }
      ];
      
      mockAttachmentRepository.bulkCreate = jest.fn().mockResolvedValue(mockAttachments);
      
      // Mock conversation update
      mockConversationRepository.updateLastMessage = jest.fn().mockResolvedValue([1]);
      
      // Mock get message with attachments
      const mockMessageWithAttachments = {
        ...mockMessage,
        attachments: mockAttachments
      };
      
      const getMessageWithAttachmentsSpy = jest.spyOn(messageService, 'getMessageWithAttachments')
        .mockResolvedValue(mockMessageWithAttachments);
      
      // Call the service method
      const result = await messageService.sendMessage(
        123,
        1,
        'Check this out!',
        attachments
      );
      
      // Assertions
      expect(mockMessageRepository.create).toHaveBeenCalledWith({
        sender_id: 123,
        conversation_id: 1,
        content: 'Check this out!'
      });
      
      expect(mockAttachmentRepository.bulkCreate).toHaveBeenCalledWith([
        { ...attachments[0], message_id: 1 },
        { ...attachments[1], message_id: 1 }
      ]);
      
      expect(mockConversationRepository.updateLastMessage).toHaveBeenCalledWith(
        1,
        1,
        expect.any(Date)
      );
      
      expect(getMessageWithAttachmentsSpy).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockMessageWithAttachments);
      
      // Restore the spy
      getMessageWithAttachmentsSpy.mockRestore();
    });
  });

  describe('getMessageWithAttachments', () => {
    test('should return message with its attachments', async () => {
      // Mock message with attachments
      const mockMessage = {
        id: 1,
        sender_id: 123,
        conversation_id: 1,
        content: 'Check this out!',
        created_at: new Date(),
        attachments: [
          { id: 1, message_id: 1, file_id: 'file-1', file_name: 'document.pdf' },
          { id: 2, message_id: 1, file_id: 'file-2', file_name: 'image.jpg' }
        ]
      };
      
      mockMessageRepository.findById = jest.fn().mockResolvedValue(mockMessage);
      
      // Call the service method
      const result = await messageService.getMessageWithAttachments(1);
      
      // Assertions
      expect(mockMessageRepository.findById).toHaveBeenCalledWith(1, {
        include: ['attachments']
      });
      expect(result).toEqual(mockMessage);
    });
    
    test('should throw error if message not found', async () => {
      mockMessageRepository.findById = jest.fn().mockResolvedValue(null);
      
      // Call the service method and expect it to throw
      await expect(
        messageService.getMessageWithAttachments(999)
      ).rejects.toThrow(CustomError);
      
      // Assertions
      expect(mockMessageRepository.findById).toHaveBeenCalledWith(999, {
        include: ['attachments']
      });
    });
  });

  describe('getConversationHistory', () => {
    test('should return conversation history and update last read', async () => {
      // Mock update last read message
      mockParticipantRepository.updateLastReadMessage = jest.fn().mockResolvedValue([1]);
      
      // Mock conversation messages
      const mockMessages = [
        {
          id: 1,
          sender_id: 123,
          conversation_id: 1,
          content: 'Hello!',
          created_at: new Date(Date.now() - 60000) // 1 minute ago
        },
        {
          id: 2,
          sender_id: 456,
          conversation_id: 1,
          content: 'Hi there!',
          created_at: new Date()
        }
      ];
      
      mockMessageRepository.getConversation = jest.fn().mockResolvedValue(mockMessages);
      
      // Call the service method
      const result = await messageService.getConversationHistory(1, 123);
      
      // Assertions
      expect(mockParticipantRepository.updateLastReadMessage).toHaveBeenCalledWith(1, 123);
      expect(mockMessageRepository.getConversation).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockMessages);
    });
  });
}); 