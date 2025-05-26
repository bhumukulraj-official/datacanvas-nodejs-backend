const apiKeyService = require('../../../../src/services/auth/apiKey.service');
const ApiKeyRepository = require('../../../../src/data/repositories/auth/ApiKeyRepository');
const passwordUtil = require('../../../../src/utils/password.util');

// Mock the repository
jest.mock('../../../../src/data/repositories/auth/ApiKeyRepository');

// Mock the password utility
jest.mock('../../../../src/utils/password.util', () => ({
  generateApiKey: jest.fn(),
  hashApiKey: jest.fn()
}));

describe('ApiKeyService', () => {
  let mockApiKeyRepository;
  
  beforeEach(() => {
    // Create new instance of mocked repository
    mockApiKeyRepository = new ApiKeyRepository();
    
    // Reset mock implementations
    jest.clearAllMocks();
    
    // Mock repository on the service
    apiKeyService.apiKeyRepo = mockApiKeyRepository;
  });

  describe('createApiKey', () => {
    test('should create a new API key successfully', async () => {
      const userId = 1;
      const name = 'Test API Key';
      const rawKey = 'raw_api_key_123';
      const hashedKey = 'hashed_api_key_123';
      
      // Mock password utility functions
      passwordUtil.generateApiKey.mockReturnValue(rawKey);
      passwordUtil.hashApiKey.mockReturnValue(hashedKey);
      
      // Mock created API key
      const mockApiKey = {
        id: 1,
        user_id: userId,
        name,
        key: hashedKey,
        is_active: true,
        created_at: new Date(),
        get: jest.fn().mockReturnValue({
          id: 1,
          user_id: userId,
          name,
          key: hashedKey,
          is_active: true,
          created_at: new Date()
        })
      };
      
      mockApiKeyRepository.create = jest.fn().mockResolvedValue(mockApiKey);
      
      // Call the service method
      const result = await apiKeyService.createApiKey(userId, name);
      
      // Assertions
      expect(passwordUtil.generateApiKey).toHaveBeenCalled();
      expect(passwordUtil.hashApiKey).toHaveBeenCalledWith(rawKey);
      expect(mockApiKeyRepository.create).toHaveBeenCalledWith({
        user_id: userId,
        name,
        key: hashedKey,
        is_active: true
      });
      expect(result).toEqual({
        id: 1,
        user_id: userId,
        name,
        key: hashedKey,
        is_active: true,
        created_at: expect.any(Date),
        rawKey
      });
    });
  });

  describe('validateApiKey', () => {
    test('should validate an API key successfully', async () => {
      const key = 'raw_api_key_123';
      const hashedKey = 'hashed_api_key_123';
      
      // Mock password utility function
      passwordUtil.hashApiKey.mockReturnValue(hashedKey);
      
      // Mock API key validation
      const mockApiKey = {
        id: 1,
        user_id: 1,
        name: 'Test API Key',
        key: hashedKey,
        is_active: true
      };
      
      mockApiKeyRepository.findActiveByKey = jest.fn().mockResolvedValue(mockApiKey);
      
      // Call the service method
      const result = await apiKeyService.validateApiKey(key);
      
      // Assertions
      expect(passwordUtil.hashApiKey).toHaveBeenCalledWith(key);
      expect(mockApiKeyRepository.findActiveByKey).toHaveBeenCalledWith(hashedKey);
      expect(result).toEqual(mockApiKey);
    });
    
    test('should return null for invalid API key', async () => {
      const key = 'invalid_api_key';
      const hashedKey = 'hashed_invalid_key';
      
      // Mock password utility function
      passwordUtil.hashApiKey.mockReturnValue(hashedKey);
      
      // Mock API key validation to return null (key not found)
      mockApiKeyRepository.findActiveByKey = jest.fn().mockResolvedValue(null);
      
      // Call the service method
      const result = await apiKeyService.validateApiKey(key);
      
      // Assertions
      expect(passwordUtil.hashApiKey).toHaveBeenCalledWith(key);
      expect(mockApiKeyRepository.findActiveByKey).toHaveBeenCalledWith(hashedKey);
      expect(result).toBeNull();
    });
  });

  describe('rotateApiKey', () => {
    test('should rotate an API key successfully', async () => {
      const keyId = 1;
      const newRawKey = 'new_raw_api_key_123';
      const newHashedKey = 'new_hashed_api_key_123';
      
      // Mock existing API key
      const mockApiKey = {
        id: keyId,
        user_id: 1,
        name: 'Test API Key',
        key: 'old_hashed_key',
        is_active: true,
        get: jest.fn().mockReturnValue({
          id: keyId,
          user_id: 1,
          name: 'Test API Key',
          key: 'old_hashed_key',
          is_active: true
        })
      };
      
      // Mock password utility functions
      passwordUtil.generateApiKey.mockReturnValue(newRawKey);
      passwordUtil.hashApiKey.mockReturnValue(newHashedKey);
      
      // Mock repository methods
      mockApiKeyRepository.findById = jest.fn().mockResolvedValue(mockApiKey);
      mockApiKeyRepository.rotateKey = jest.fn().mockResolvedValue(true);
      
      // Call the service method
      const result = await apiKeyService.rotateApiKey(keyId);
      
      // Assertions
      expect(mockApiKeyRepository.findById).toHaveBeenCalledWith(keyId);
      expect(passwordUtil.generateApiKey).toHaveBeenCalled();
      expect(passwordUtil.hashApiKey).toHaveBeenCalledWith(newRawKey);
      expect(mockApiKeyRepository.rotateKey).toHaveBeenCalledWith(keyId, newHashedKey);
      expect(result).toEqual({
        id: keyId,
        user_id: 1,
        name: 'Test API Key',
        key: 'old_hashed_key',
        is_active: true,
        rawKey: newRawKey
      });
    });
  });
}); 