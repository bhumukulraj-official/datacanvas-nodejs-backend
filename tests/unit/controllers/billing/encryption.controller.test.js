const encryptionController = require('../../../../src/api/controllers/billing/encryption.controller');
const { EncryptionService } = require('../../../../src/services/billing');

// Mock the EncryptionService
jest.mock('../../../../src/services/billing/encryption.service', () => ({
  rotateEncryptionKey: jest.fn(),
  getKeyHistory: jest.fn()
}));

describe('EncryptionController', () => {
  let mockReq;
  let mockRes;
  let mockNext;
  
  beforeEach(() => {
    // Mock request, response, and next
    mockReq = {
      user: { id: 'user-123' },
      ip: '127.0.0.1',
      params: {
        version: 'v1'
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

  describe('rotateKey', () => {
    test('should rotate encryption key successfully', async () => {
      const mockKey = {
        id: 'key-123',
        version: 'v2',
        created_by: 'user-123'
      };
      
      // Mock the rotateEncryptionKey service method
      EncryptionService.rotateEncryptionKey.mockResolvedValue(mockKey);
      
      await encryptionController.rotateKey(mockReq, mockRes, mockNext);
      
      expect(EncryptionService.rotateEncryptionKey).toHaveBeenCalledWith(
        mockReq.user.id,
        mockReq.ip
      );
      
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockKey
      });
    });
    
    test('should call next with error on failure', async () => {
      const mockError = new Error('Failed to rotate encryption key');
      
      // Mock the rotateEncryptionKey service method to throw an error
      EncryptionService.rotateEncryptionKey.mockRejectedValue(mockError);
      
      await encryptionController.rotateKey(mockReq, mockRes, mockNext);
      
      expect(EncryptionService.rotateEncryptionKey).toHaveBeenCalledWith(
        mockReq.user.id,
        mockReq.ip
      );
      
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('getKeyHistory', () => {
    test('should get key history successfully', async () => {
      const mockHistory = [
        { id: 'key-1', version: 'v1', created_at: '2023-01-01' },
        { id: 'key-2', version: 'v2', created_at: '2023-02-01' }
      ];
      
      // Mock the getKeyHistory service method
      EncryptionService.getKeyHistory.mockResolvedValue(mockHistory);
      
      await encryptionController.getKeyHistory(mockReq, mockRes, mockNext);
      
      expect(EncryptionService.getKeyHistory).toHaveBeenCalledWith(
        mockReq.params.version
      );
      
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockHistory
      });
    });
    
    test('should call next with error on failure', async () => {
      const mockError = new Error('Failed to get key history');
      
      // Mock the getKeyHistory service method to throw an error
      EncryptionService.getKeyHistory.mockRejectedValue(mockError);
      
      await encryptionController.getKeyHistory(mockReq, mockRes, mockNext);
      
      expect(EncryptionService.getKeyHistory).toHaveBeenCalledWith(
        mockReq.params.version
      );
      
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });
}); 