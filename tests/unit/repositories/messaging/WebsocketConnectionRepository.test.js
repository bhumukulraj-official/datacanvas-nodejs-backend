const { Op } = require('sequelize');
const WebsocketConnectionRepository = require('../../../../src/data/repositories/messaging/WebsocketConnectionRepository');
const { WebsocketConnection } = require('../../../../src/data/models');

// Mock the models
jest.mock('../../../../src/data/models', () => ({
  WebsocketConnection: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn()
  }
}));

// Mock sequelize Op
jest.mock('sequelize', () => ({
  Op: {
    lt: Symbol('lt')
  }
}));

describe('WebsocketConnectionRepository', () => {
  let repository;
  
  beforeEach(() => {
    repository = new WebsocketConnectionRepository();
    jest.clearAllMocks();
  });

  test('constructor should set the model correctly', () => {
    expect(repository.model).toBe(WebsocketConnection);
  });

  test('findByConnectionId should call findOne with correct parameters', async () => {
    const connectionId = 'conn-123';
    const mockConnection = { id: 1, connection_id: connectionId };
    WebsocketConnection.findOne.mockResolvedValue(mockConnection);

    const result = await repository.findByConnectionId(connectionId);
    
    expect(WebsocketConnection.findOne).toHaveBeenCalledWith({
      where: { connection_id: connectionId }
    });
    expect(result).toEqual(mockConnection);
  });

  test('getActiveConnectionsByUser should call findAll with correct parameters', async () => {
    const userId = 5;
    const mockConnections = [
      { id: 1, user_id: userId, connection_status: 'connected' },
      { id: 2, user_id: userId, connection_status: 'connected' }
    ];
    WebsocketConnection.findAll.mockResolvedValue(mockConnections);

    const result = await repository.getActiveConnectionsByUser(userId);
    
    expect(WebsocketConnection.findAll).toHaveBeenCalledWith({
      where: {
        user_id: userId,
        connection_status: 'connected'
      }
    });
    expect(result).toEqual(mockConnections);
  });

  test('updateStatus should call update with correct parameters for connected status', async () => {
    const connectionId = 'conn-123';
    const status = 'connected';
    const updateResult = [1]; // Number of affected rows
    
    WebsocketConnection.update.mockResolvedValue(updateResult);

    const result = await repository.updateStatus(connectionId, status);
    
    expect(WebsocketConnection.update).toHaveBeenCalledWith(
      { connection_status: status },
      { where: { connection_id: connectionId } }
    );
    expect(result).toEqual(updateResult);
  });

  test('updateStatus should include disconnected_at when status is disconnected', async () => {
    const connectionId = 'conn-123';
    const status = 'disconnected';
    const updateResult = [1]; // Number of affected rows
    
    // Mock Date for consistent testing
    const now = new Date();
    jest.spyOn(global, 'Date').mockImplementation(() => now);
    
    WebsocketConnection.update.mockResolvedValue(updateResult);

    const result = await repository.updateStatus(connectionId, status);
    
    expect(WebsocketConnection.update).toHaveBeenCalledWith(
      { 
        connection_status: status,
        disconnected_at: now
      },
      { where: { connection_id: connectionId } }
    );
    expect(result).toEqual(updateResult);
    
    // Restore Date mock
    global.Date.mockRestore();
  });

  test('updateLastPing should call update with correct parameters', async () => {
    const connectionId = 'conn-123';
    const updateResult = [1]; // Number of affected rows
    
    // Mock Date for consistent testing
    const now = new Date();
    jest.spyOn(global, 'Date').mockImplementation(() => now);
    
    WebsocketConnection.update.mockResolvedValue(updateResult);

    const result = await repository.updateLastPing(connectionId);
    
    expect(WebsocketConnection.update).toHaveBeenCalledWith(
      { last_ping_at: now },
      { where: { connection_id: connectionId } }
    );
    expect(result).toEqual(updateResult);
    
    // Restore Date mock
    global.Date.mockRestore();
  });

  test('getIdleConnections should call findAll with correct parameters', async () => {
    const idleThreshold = 300000; // 5 minutes
    const mockConnections = [{ id: 1 }, { id: 2 }];
    WebsocketConnection.findAll.mockResolvedValue(mockConnections);
    
    // Mock Date.now for consistent testing
    const now = 1609459200000; // 2021-01-01
    jest.spyOn(Date, 'now').mockReturnValue(now);
    
    const result = await repository.getIdleConnections(idleThreshold);
    
    expect(WebsocketConnection.findAll).toHaveBeenCalledWith({
      where: {
        connection_status: 'connected',
        last_ping_at: {
          [Op.lt]: new Date(now - idleThreshold)
        }
      }
    });
    expect(result).toEqual(mockConnections);
    
    // Restore Date.now mock
    Date.now.mockRestore();
  });

  test('getConnectionsByStatus should call findAll with correct parameters', async () => {
    const status = 'connected';
    const mockConnections = [{ id: 1 }, { id: 2 }];
    WebsocketConnection.findAll.mockResolvedValue(mockConnections);

    const result = await repository.getConnectionsByStatus(status);
    
    expect(WebsocketConnection.findAll).toHaveBeenCalledWith({
      where: { connection_status: status }
    });
    expect(result).toEqual(mockConnections);
  });
}); 