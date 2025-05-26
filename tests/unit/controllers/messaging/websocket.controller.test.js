const { WebsocketController } = require('../../../../src/api/controllers/messaging');
const { WebsocketService } = require('../../../../src/services/messaging');

// Mock the service
jest.mock('../../../../src/services/messaging', () => ({
  WebsocketService: {
    getConnectionMessages: jest.fn()
  }
}));

describe('WebsocketController', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: {
        connectionId: 'test-connection-id'
      }
    };
    res = {
      json: jest.fn()
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getConnectionMessages', () => {
    it('should return messages for a connection', async () => {
      // Arrange
      const mockMessages = [{ id: 1, content: 'Test message' }];
      WebsocketService.getConnectionMessages.mockResolvedValue(mockMessages);

      // Act
      await WebsocketController.getConnectionMessages(req, res, next);

      // Assert
      expect(WebsocketService.getConnectionMessages).toHaveBeenCalledWith('test-connection-id');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockMessages
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if service throws', async () => {
      // Arrange
      const error = new Error('Service error');
      WebsocketService.getConnectionMessages.mockRejectedValue(error);

      // Act
      await WebsocketController.getConnectionMessages(req, res, next);

      // Assert
      expect(WebsocketService.getConnectionMessages).toHaveBeenCalledWith('test-connection-id');
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });
}); 