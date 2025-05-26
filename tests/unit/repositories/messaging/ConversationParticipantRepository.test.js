const { Op } = require('sequelize');
const ConversationParticipantRepository = require('../../../../src/data/repositories/messaging/ConversationParticipantRepository');
const { ConversationParticipant } = require('../../../../src/data/models');

// Mock the models
jest.mock('../../../../src/data/models', () => ({
  ConversationParticipant: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn()
  }
}));

describe('ConversationParticipantRepository', () => {
  let repository;
  
  beforeEach(() => {
    repository = new ConversationParticipantRepository();
    jest.clearAllMocks();
  });

  test('constructor should set the model correctly', () => {
    expect(repository.model).toBe(ConversationParticipant);
  });

  test('getByConversation should call findAll with correct parameters', async () => {
    const conversationId = 10;
    const mockParticipants = [{ id: 1 }, { id: 2 }];
    
    ConversationParticipant.findAll.mockResolvedValue(mockParticipants);

    const result = await repository.getByConversation(conversationId);
    
    expect(ConversationParticipant.findAll).toHaveBeenCalledWith({
      where: { 
        conversation_id: conversationId,
        is_deleted: false 
      }
    });
    expect(result).toEqual(mockParticipants);
  });

  test('getByUser should call findAll with correct parameters', async () => {
    const userId = 5;
    const mockParticipants = [{ id: 1 }, { id: 2 }];
    
    ConversationParticipant.findAll.mockResolvedValue(mockParticipants);

    const result = await repository.getByUser(userId);
    
    expect(ConversationParticipant.findAll).toHaveBeenCalledWith({
      where: { 
        user_id: userId,
        is_deleted: false 
      }
    });
    expect(result).toEqual(mockParticipants);
  });

  test('findParticipant should call findOne with correct parameters', async () => {
    const conversationId = 10;
    const userId = 5;
    const mockParticipant = { id: 1, conversation_id: conversationId, user_id: userId };
    
    ConversationParticipant.findOne.mockResolvedValue(mockParticipant);

    const result = await repository.findParticipant(conversationId, userId);
    
    expect(ConversationParticipant.findOne).toHaveBeenCalledWith({
      where: {
        conversation_id: conversationId,
        user_id: userId,
        is_deleted: false
      }
    });
    expect(result).toEqual(mockParticipant);
  });

  test('updateLastReadMessage should call update with correct parameters', async () => {
    const conversationId = 10;
    const userId = 5;
    const messageId = 20;
    const updateResult = [1]; // Number of affected rows
    
    ConversationParticipant.update.mockResolvedValue(updateResult);

    const result = await repository.updateLastReadMessage(conversationId, userId, messageId);
    
    expect(ConversationParticipant.update).toHaveBeenCalledWith(
      { last_read_message_id: messageId },
      {
        where: {
          conversation_id: conversationId,
          user_id: userId,
          is_deleted: false
        }
      }
    );
    expect(result).toEqual(updateResult);
  });

  test('toggleMute should call update with correct parameters', async () => {
    const conversationId = 10;
    const userId = 5;
    const isMuted = true;
    const updateResult = [1]; // Number of affected rows
    
    ConversationParticipant.update.mockResolvedValue(updateResult);

    const result = await repository.toggleMute(conversationId, userId, isMuted);
    
    expect(ConversationParticipant.update).toHaveBeenCalledWith(
      { is_muted: isMuted },
      {
        where: {
          conversation_id: conversationId,
          user_id: userId,
          is_deleted: false
        }
      }
    );
    expect(result).toEqual(updateResult);
  });
}); 