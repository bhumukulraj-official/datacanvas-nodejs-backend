const websocketService = require('../../../../src/services/messaging/websocket.service');
const { WebsocketConnectionRepository, WebsocketMessageRepository } = require('../../../../src/data/repositories/messaging');
const { CustomError } = require('../../../../src/utils/error.util');

// Mock the repositories
jest.mock('../../../../src/data/repositories/messaging', () => ({
  WebsocketConnectionRepository: jest.fn(),
  WebsocketMessageRepository: jest.fn()
}));

describe('WebsocketService', () => {
  let mockConnectionRepository;
  let mockMessageRepository;
  
  beforeEach(() => {
    // Create new instances of mocked repositories
    mockConnectionRepository = new WebsocketConnectionRepository();
    mockMessageRepository = new WebsocketMessageRepository();
    
    // Reset mock implementations
    jest.clearAllMocks();
    
    // Mock repositories on the service
    websocketService.connectionRepo = mockConnectionRepository;
    websocketService.messageRepo = mockMessageRepository;
  });

  describe('trackConnection', () => {
    test('should track a new websocket connection', async () => {
      const userId = 1;
      const connectionId = 'conn_123';
      
      // Mock connection creation
      const mockConnection = {
        id: 1,
        user_id: userId,
        connection_id: connectionId,
        connection_status: 'connected',
        created_at: new Date()
      };
      
      mockConnectionRepository.create = jest.fn().mockResolvedValue(mockConnection);
      
      // Call the service method
      const result = await websocketService.trackConnection(userId, connectionId);
      
      // Assertions
      expect(mockConnectionRepository.create).toHaveBeenCalledWith({
        user_id: userId,
        connection_id: connectionId,
        connection_status: 'connected'
      });
      expect(result).toEqual(mockConnection);
    });
  });

  describe('handleDisconnect', () => {
    test('should update connection status on disconnect', async () => {
      const connectionId = 'conn_123';
      
      // Mock updated connection
      const mockUpdatedConnection = {
        id: 1,
        user_id: 1,
        connection_id: connectionId,
        connection_status: 'disconnected',
        updated_at: new Date()
      };
      
      mockConnectionRepository.updateStatus = jest.fn().mockResolvedValue(mockUpdatedConnection);
      
      // Call the service method
      const result = await websocketService.handleDisconnect(connectionId);
      
      // Assertions
      expect(mockConnectionRepository.updateStatus).toHaveBeenCalledWith(connectionId, 'disconnected');
      expect(result).toEqual(mockUpdatedConnection);
    });
  });

  describe('sendMessage', () => {
    test('should send a websocket message', async () => {
      const connectionId = 'conn_123';
      const message = { type: 'message', data: { text: 'Hello!' } };
      
      // Mock message creation
      const mockMessage = {
        id: 1,
        connection_id: connectionId,
        message: JSON.stringify(message),
        direction: 'outgoing',
        created_at: new Date()
      };
      
      mockMessageRepository.create = jest.fn().mockResolvedValue(mockMessage);
      
      // Call the service method
      const result = await websocketService.sendMessage(connectionId, message);
      
      // Assertions
      expect(mockMessageRepository.create).toHaveBeenCalledWith({
        connection_id: connectionId,
        message: JSON.stringify(message),
        direction: 'outgoing'
      });
      expect(result).toBe(true);
    });
  });

  describe('logIncomingMessage', () => {
    test('should log an incoming websocket message', async () => {
      const connectionId = 'conn_123';
      const message = { type: 'message', data: { text: 'Hello from client!' } };
      
      // Mock message creation
      const mockMessage = {
        id: 1,
        connection_id: connectionId,
        message: JSON.stringify(message),
        direction: 'incoming',
        created_at: new Date()
      };
      
      mockMessageRepository.create = jest.fn().mockResolvedValue(mockMessage);
      
      // Call the service method
      const result = await websocketService.logIncomingMessage(connectionId, message);
      
      // Assertions
      expect(mockMessageRepository.create).toHaveBeenCalledWith({
        connection_id: connectionId,
        message: JSON.stringify(message),
        direction: 'incoming'
      });
      expect(result).toEqual(mockMessage);
    });
  });

  describe('getConnectionMessages', () => {
    test('should retrieve messages for a connection', async () => {
      const connectionId = 'conn_123';
      
      // Mock messages
      const mockMessages = [
        {
          id: 1,
          connection_id: connectionId,
          message: JSON.stringify({ type: 'message', data: { text: 'Hello!' } }),
          direction: 'outgoing',
          created_at: new Date(Date.now() - 60000) // 1 minute ago
        },
        {
          id: 2,
          connection_id: connectionId,
          message: JSON.stringify({ type: 'message', data: { text: 'Hi there!' } }),
          direction: 'incoming',
          created_at: new Date(Date.now() - 30000) // 30 seconds ago
        }
      ];
      
      mockMessageRepository.getByConnectionId = jest.fn().mockResolvedValue(mockMessages);
      
      // Call the service method
      const result = await websocketService.getConnectionMessages(connectionId);
      
      // Assertions
      expect(mockMessageRepository.getByConnectionId).toHaveBeenCalledWith(connectionId);
      expect(result).toEqual(mockMessages);
    });
  });
}); 