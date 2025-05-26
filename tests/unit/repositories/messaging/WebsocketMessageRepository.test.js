const { Op } = require('sequelize');
const WebsocketMessageRepository = require('../../../../src/data/repositories/messaging/WebsocketMessageRepository');
const { WebsocketMessage } = require('../../../../src/data/models');

// Mock the models
jest.mock('../../../../src/data/models', () => ({
  WebsocketMessage: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn()
  }
}));

describe('WebsocketMessageRepository', () => {
  let repository;
  
  beforeEach(() => {
    repository = new WebsocketMessageRepository();
    jest.clearAllMocks();
  });

  test('constructor should set the model correctly', () => {
    expect(repository.model).toBe(WebsocketMessage);
  });

  test('getByConnectionId should call findAll with correct parameters', async () => {
    const connectionId = 'conn-123';
    const mockMessages = [{ id: 1 }, { id: 2 }];
    
    WebsocketMessage.findAll.mockResolvedValue(mockMessages);

    const result = await repository.getByConnectionId(connectionId);
    
    expect(WebsocketMessage.findAll).toHaveBeenCalledWith({
      where: { connection_id: connectionId },
      order: [['created_at', 'DESC']]
    });
    expect(result).toEqual(mockMessages);
  });

  test('getByMessageId should call findOne with correct parameters', async () => {
    const messageId = 'msg-123';
    const mockMessage = { id: 1, message_id: messageId };
    
    WebsocketMessage.findOne.mockResolvedValue(mockMessage);

    const result = await repository.getByMessageId(messageId);
    
    expect(WebsocketMessage.findOne).toHaveBeenCalledWith({
      where: { message_id: messageId }
    });
    expect(result).toEqual(mockMessage);
  });

  test('getByMessageType should call findAll with correct parameters', async () => {
    const messageType = 'notification';
    const mockMessages = [{ id: 1 }, { id: 2 }];
    
    WebsocketMessage.findAll.mockResolvedValue(mockMessages);

    const result = await repository.getByMessageType(messageType);
    
    expect(WebsocketMessage.findAll).toHaveBeenCalledWith({
      where: { message_type: messageType },
      order: [['created_at', 'DESC']]
    });
    expect(result).toEqual(mockMessages);
  });

  test('getByDirection should call findAll with correct parameters', async () => {
    const connectionId = 'conn-123';
    const direction = 'outbound';
    const mockMessages = [{ id: 1 }, { id: 2 }];
    
    WebsocketMessage.findAll.mockResolvedValue(mockMessages);

    const result = await repository.getByDirection(connectionId, direction);
    
    expect(WebsocketMessage.findAll).toHaveBeenCalledWith({
      where: {
        connection_id: connectionId,
        direction
      },
      order: [['created_at', 'DESC']]
    });
    expect(result).toEqual(mockMessages);
  });

  test('updateStatus should call update with correct parameters when error details provided', async () => {
    const messageId = 'msg-123';
    const status = 'delivered';
    const errorDetails = 'Connection timeout';
    const updateResult = [1]; // Number of affected rows
    
    WebsocketMessage.update.mockResolvedValue(updateResult);

    const result = await repository.updateStatus(messageId, status, errorDetails);
    
    expect(WebsocketMessage.update).toHaveBeenCalledWith(
      { status, error_details: errorDetails },
      { where: { message_id: messageId } }
    );
    expect(result).toEqual(updateResult);
  });

  test('updateStatus should call update with correct parameters when no error details provided', async () => {
    const messageId = 'msg-123';
    const status = 'delivered';
    const updateResult = [1]; // Number of affected rows
    
    WebsocketMessage.update.mockResolvedValue(updateResult);

    const result = await repository.updateStatus(messageId, status);
    
    expect(WebsocketMessage.update).toHaveBeenCalledWith(
      { status },
      { where: { message_id: messageId } }
    );
    expect(result).toEqual(updateResult);
  });

  test('getRecentMessages should call findAll with correct parameters and default limit', async () => {
    const mockMessages = [{ id: 1 }, { id: 2 }];
    
    WebsocketMessage.findAll.mockResolvedValue(mockMessages);

    const result = await repository.getRecentMessages();
    
    expect(WebsocketMessage.findAll).toHaveBeenCalledWith({
      order: [['created_at', 'DESC']],
      limit: 100
    });
    expect(result).toEqual(mockMessages);
  });

  test('getRecentMessages should call findAll with custom limit', async () => {
    const limit = 50;
    const mockMessages = [{ id: 1 }, { id: 2 }];
    
    WebsocketMessage.findAll.mockResolvedValue(mockMessages);

    const result = await repository.getRecentMessages(limit);
    
    expect(WebsocketMessage.findAll).toHaveBeenCalledWith({
      order: [['created_at', 'DESC']],
      limit
    });
    expect(result).toEqual(mockMessages);
  });
}); 