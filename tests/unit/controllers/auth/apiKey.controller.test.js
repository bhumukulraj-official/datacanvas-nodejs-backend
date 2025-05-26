const { ApiKeyController } = require('../../../../src/api/controllers/auth');
const { ApiKeyService } = require('../../../../src/services/auth');
const logger = require('../../../../src/utils/logger.util');

// Mock dependencies
jest.mock('../../../../src/services/auth', () => ({
  ApiKeyService: {
    createApiKey: jest.fn(),
    rotateApiKey: jest.fn(),
    getUserApiKeys: jest.fn()
  }
}));

jest.mock('../../../../src/utils/logger.util', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  error: jest.fn()
}));

describe('ApiKeyController', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: { id: 'user-123' },
      body: { name: 'Test API Key' },
      params: { keyId: 'key-123' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createApiKey', () => {
    it('should create an API key successfully', async () => {
      // Arrange
      const mockApiKey = { id: 'key-123', name: 'Test API Key', key: 'secret-key-123' };
      ApiKeyService.createApiKey.mockResolvedValue(mockApiKey);

      // Act
      await ApiKeyController.createApiKey(req, res, next);

      // Assert
      expect(ApiKeyService.createApiKey).toHaveBeenCalledWith('user-123', 'Test API Key');
      expect(logger.debug).toHaveBeenCalledWith('Creating API key', expect.any(Object));
      expect(logger.info).toHaveBeenCalledWith('API key created successfully', expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockApiKey
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if service throws', async () => {
      // Arrange
      const error = new Error('Service error');
      ApiKeyService.createApiKey.mockRejectedValue(error);

      // Act
      await ApiKeyController.createApiKey(req, res, next);

      // Assert
      expect(ApiKeyService.createApiKey).toHaveBeenCalledWith('user-123', 'Test API Key');
      expect(logger.error).toHaveBeenCalledWith('Error creating API key', expect.any(Object));
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('rotateApiKey', () => {
    it('should rotate an API key successfully', async () => {
      // Arrange
      const mockApiKey = { id: 'key-123', name: 'Test API Key', key: 'new-secret-key-123' };
      ApiKeyService.rotateApiKey.mockResolvedValue(mockApiKey);

      // Act
      await ApiKeyController.rotateApiKey(req, res, next);

      // Assert
      expect(ApiKeyService.rotateApiKey).toHaveBeenCalledWith('key-123');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockApiKey
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if service throws', async () => {
      // Arrange
      const error = new Error('Service error');
      ApiKeyService.rotateApiKey.mockRejectedValue(error);

      // Act
      await ApiKeyController.rotateApiKey(req, res, next);

      // Assert
      expect(ApiKeyService.rotateApiKey).toHaveBeenCalledWith('key-123');
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('listApiKeys', () => {
    it('should list user API keys successfully', async () => {
      // Arrange
      const mockApiKeys = [
        { id: 'key-123', name: 'Test API Key 1' },
        { id: 'key-456', name: 'Test API Key 2' }
      ];
      ApiKeyService.getUserApiKeys.mockResolvedValue(mockApiKeys);

      // Act
      await ApiKeyController.listApiKeys(req, res, next);

      // Assert
      expect(ApiKeyService.getUserApiKeys).toHaveBeenCalledWith('user-123');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockApiKeys
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if service throws', async () => {
      // Arrange
      const error = new Error('Service error');
      ApiKeyService.getUserApiKeys.mockRejectedValue(error);

      // Act
      await ApiKeyController.listApiKeys(req, res, next);

      // Assert
      expect(ApiKeyService.getUserApiKeys).toHaveBeenCalledWith('user-123');
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });
}); 