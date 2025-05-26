const { Op } = require('sequelize');
const MessageRepository = require('../../../../src/data/repositories/messaging/MessageRepository');
const { Message } = require('../../../../src/data/models');

// Mock the models
jest.mock('../../../../src/data/models', () => ({
  Message: {
    findAll: jest.fn()
  }
}));

// Mock the sequelize Op
jest.mock('sequelize', () => ({
  Op: {
    or: Symbol('or'),
    gt: Symbol('gt')
  }
}));

describe('MessageRepository', () => {
  let repository;
  
  beforeEach(() => {
    repository = new MessageRepository();
    jest.clearAllMocks();
  });

  test('constructor should set the model correctly', () => {
    expect(repository.model).toBe(Message);
  });

  test('getConversation should call findAll with correct parameters when projectId is provided', async () => {
    const senderId = 1;
    const receiverId = 2;
    const projectId = 10;
    const mockMessages = [{ id: 1 }, { id: 2 }];
    
    Message.findAll.mockResolvedValue(mockMessages);

    const result = await repository.getConversation(senderId, receiverId, projectId);
    
    expect(Message.findAll).toHaveBeenCalledWith({
      where: {
        [Op.or]: [
          { sender_id: senderId, receiver_id: receiverId },
          { sender_id: receiverId, receiver_id: senderId }
        ],
        project_id: projectId
      },
      order: [['created_at', 'ASC']],
      include: ['attachments']
    });
    expect(result).toEqual(mockMessages);
  });

  test('getConversation should call findAll with correct parameters when projectId is not provided', async () => {
    const senderId = 1;
    const receiverId = 2;
    const mockMessages = [{ id: 1 }, { id: 2 }];
    
    Message.findAll.mockResolvedValue(mockMessages);

    const result = await repository.getConversation(senderId, receiverId);
    
    expect(Message.findAll).toHaveBeenCalledWith({
      where: {
        [Op.or]: [
          { sender_id: senderId, receiver_id: receiverId },
          { sender_id: receiverId, receiver_id: senderId }
        ]
      },
      order: [['created_at', 'ASC']],
      include: ['attachments']
    });
    expect(result).toEqual(mockMessages);
  });
}); 