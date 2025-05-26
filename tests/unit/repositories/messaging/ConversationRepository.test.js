const { Op } = require('sequelize');
const ConversationRepository = require('../../../../src/data/repositories/messaging/ConversationRepository');
const { Conversation, Message, ConversationParticipant } = require('../../../../src/data/models');

// Mock the models
jest.mock('../../../../src/data/models', () => ({
  Conversation: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn()
  },
  Message: {},
  ConversationParticipant: {}
}));

describe('ConversationRepository', () => {
  let repository;
  
  beforeEach(() => {
    repository = new ConversationRepository();
    jest.clearAllMocks();
  });

  test('constructor should set the model correctly', () => {
    expect(repository.model).toBe(Conversation);
  });

  test('findByUuid should call model findOne with correct parameters', async () => {
    const uuid = 'test-uuid-123';
    const mockConversation = { id: 1, uuid };
    Conversation.findOne.mockResolvedValue(mockConversation);

    const result = await repository.findByUuid(uuid);
    
    expect(Conversation.findOne).toHaveBeenCalledWith({ where: { uuid } });
    expect(result).toEqual(mockConversation);
  });

  test('getParticipantConversations should call findAll with correct parameters', async () => {
    const userId = 5;
    const mockConversations = [{ id: 1 }, { id: 2 }];
    Conversation.findAll.mockResolvedValue(mockConversations);

    const result = await repository.getParticipantConversations(userId);
    
    expect(Conversation.findAll).toHaveBeenCalledWith({
      include: [
        {
          model: ConversationParticipant,
          where: { 
            user_id: userId,
            is_deleted: false
          }
        },
        {
          model: Message,
          as: 'lastMessage'
        }
      ],
      where: { is_deleted: false },
      order: [['last_message_at', 'DESC']]
    });
    expect(result).toEqual(mockConversations);
  });

  test('getWithMessages should call findOne with correct parameters', async () => {
    const conversationId = 10;
    const mockConversation = { 
      id: conversationId, 
      messages: [{ id: 1 }, { id: 2 }],
      participants: [{ id: 5 }, { id: 6 }]
    };
    Conversation.findOne.mockResolvedValue(mockConversation);

    const result = await repository.getWithMessages(conversationId);
    
    expect(Conversation.findOne).toHaveBeenCalledWith({
      where: { id: conversationId, is_deleted: false },
      include: [
        {
          model: Message,
          where: { is_deleted: false },
          order: [['created_at', 'ASC']],
          include: ['attachments']
        },
        {
          model: ConversationParticipant,
          where: { is_deleted: false }
        }
      ]
    });
    expect(result).toEqual(mockConversation);
  });

  test('updateLastMessage should call update with correct parameters', async () => {
    const conversationId = 10;
    const messageId = 20;
    const messageDate = new Date();
    const updateResult = [1]; // Number of affected rows
    Conversation.update.mockResolvedValue(updateResult);

    const result = await repository.updateLastMessage(conversationId, messageId, messageDate);
    
    expect(Conversation.update).toHaveBeenCalledWith({
      last_message_id: messageId,
      last_message_at: messageDate
    }, {
      where: { id: conversationId }
    });
    expect(result).toEqual(updateResult);
  });
}); 