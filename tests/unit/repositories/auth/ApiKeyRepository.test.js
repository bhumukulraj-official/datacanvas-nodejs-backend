const { Op } = require('sequelize');
const ApiKeyRepository = require('../../../../src/data/repositories/auth/ApiKeyRepository');
const { ApiKey } = require('../../../../src/data/models');

// Mock the models
jest.mock('../../../../src/data/models', () => ({
  ApiKey: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn()
  }
}));

describe('ApiKeyRepository', () => {
  let repository;
  
  beforeEach(() => {
    repository = new ApiKeyRepository();
    jest.clearAllMocks();
  });

  test('constructor should set the model correctly', () => {
    expect(repository.model).toBe(ApiKey);
  });

  test('findByKey should call model findOne with correct parameters', async () => {
    const key = 'test-api-key';
    const mockApiKey = { id: 1, key };
    ApiKey.findOne.mockResolvedValue(mockApiKey);

    const result = await repository.findByKey(key);
    
    expect(ApiKey.findOne).toHaveBeenCalledWith({ where: { key } });
    expect(result).toEqual(mockApiKey);
  });

  test('findActiveByKey should call findOne with correct parameters', async () => {
    const key = 'test-active-key';
    const mockApiKey = { id: 1, key, is_active: true };
    ApiKey.findOne.mockResolvedValue(mockApiKey);

    const result = await repository.findActiveByKey(key);
    
    expect(ApiKey.findOne).toHaveBeenCalledWith({ 
      where: { 
        key,
        is_active: true,
        expires_at: { [Op.gt]: expect.any(Date) }
      }
    });
    expect(result).toEqual(mockApiKey);
  });

  test('findByUserId should call findAll with correct parameters', async () => {
    const userId = 5;
    const mockApiKeys = [{ id: 1 }, { id: 2 }];
    ApiKey.findAll.mockResolvedValue(mockApiKeys);

    const result = await repository.findByUserId(userId);
    
    expect(ApiKey.findAll).toHaveBeenCalledWith({ where: { user_id: userId } });
    expect(result).toEqual(mockApiKeys);
  });

  test('deactivateKey should call update with correct parameters', async () => {
    // Mock the update method
    repository.update = jest.fn().mockResolvedValue({ id: 1, is_active: false });
    const keyId = 1;

    const result = await repository.deactivateKey(keyId);
    
    expect(repository.update).toHaveBeenCalledWith(keyId, { is_active: false });
    expect(result).toEqual({ id: 1, is_active: false });
  });

  test('rotateKey should call findById and update with correct parameters', async () => {
    const keyId = 1;
    const newKey = 'new-key';
    const newKeyHash = 'new-key-hash';
    const oldKey = 'old-key';
    const mockApiKey = { id: keyId, key: oldKey };
    
    // Mock the necessary methods
    repository.findById = jest.fn().mockResolvedValue(mockApiKey);
    repository.update = jest.fn().mockResolvedValue({ 
      id: keyId, 
      key: newKey,
      key_hash: newKeyHash,
      previous_key: oldKey
    });

    const result = await repository.rotateKey(keyId, newKey, newKeyHash);
    
    expect(repository.findById).toHaveBeenCalledWith(keyId);
    expect(repository.update).toHaveBeenCalledWith(keyId, {
      key: newKey,
      key_hash: newKeyHash,
      previous_key: oldKey,
      last_rotated_at: expect.any(Date)
    });
    expect(result).toEqual({ 
      id: keyId, 
      key: newKey,
      key_hash: newKeyHash,
      previous_key: oldKey
    });
  });
}); 