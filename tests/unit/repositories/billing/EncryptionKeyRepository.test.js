const { EncryptionKeyRepository } = require('../../../../src/data/repositories/billing');
const { EncryptionKey } = require('../../../../src/data/models');

// Mock the model
jest.mock('../../../../src/data/models', () => ({
  EncryptionKey: {
    findOne: jest.fn()
  }
}));

// Mock the BaseRepository
jest.mock('../../../../src/data/repositories/BaseRepository', () => {
  return class MockBaseRepository {
    constructor(model) {
      this.model = model;
    }
  };
});

describe('EncryptionKeyRepository', () => {
  let repository;
  
  beforeEach(() => {
    repository = new EncryptionKeyRepository();
    jest.clearAllMocks();
  });

  test('getActiveKey should call findOne with correct parameters', async () => {
    const mockKey = { id: 1, version: 'v1', is_active: true };
    EncryptionKey.findOne.mockResolvedValue(mockKey);
    
    const result = await repository.getActiveKey();
    
    expect(EncryptionKey.findOne).toHaveBeenCalledWith({ where: { is_active: true } });
    expect(result).toEqual(mockKey);
  });

  test('getByVersion should call findOne with correct parameters', async () => {
    const version = 'v1';
    const mockKey = { id: 1, version };
    EncryptionKey.findOne.mockResolvedValue(mockKey);
    
    const result = await repository.getByVersion(version);
    
    expect(EncryptionKey.findOne).toHaveBeenCalledWith({ where: { version } });
    expect(result).toEqual(mockKey);
  });

  test('getByKeyIdentifier should call findOne with correct parameters', async () => {
    const keyIdentifier = 'key-123';
    const mockKey = { id: 1, key_identifier: keyIdentifier };
    EncryptionKey.findOne.mockResolvedValue(mockKey);
    
    const result = await repository.getByKeyIdentifier(keyIdentifier);
    
    expect(EncryptionKey.findOne).toHaveBeenCalledWith({ where: { key_identifier: keyIdentifier } });
    expect(result).toEqual(mockKey);
  });
}); 