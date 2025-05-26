const { StorageProviderRepository } = require('../../../../src/data/repositories/content');
const { StorageProvider } = require('../../../../src/data/models');

// Mock the models
jest.mock('../../../../src/data/models', () => ({
  StorageProvider: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn()
  }
}));

// Mock the BaseRepository
jest.mock('../../../../src/data/repositories/BaseRepository', () => {
  return class MockBaseRepository {
    constructor(model) {
      this.model = model;
    }
    
    async update(id, data) {
      return { id, ...data };
    }
  };
});

describe('StorageProviderRepository', () => {
  let repository;
  
  beforeEach(() => {
    repository = new StorageProviderRepository();
    jest.clearAllMocks();
  });

  test('getByCode should call findOne with correct parameters', async () => {
    const code = 's3';
    const mockProvider = { id: 1, code, name: 'Amazon S3' };
    
    StorageProvider.findOne.mockResolvedValue(mockProvider);
    
    const result = await repository.getByCode(code);
    
    expect(StorageProvider.findOne).toHaveBeenCalledWith({
      where: { code }
    });
    expect(result).toEqual(mockProvider);
  });

  test('getActiveProviders should call findAll with correct parameters', async () => {
    const mockProviders = [
      { id: 1, code: 's3', name: 'Amazon S3', is_active: true },
      { id: 2, code: 'gcs', name: 'Google Cloud Storage', is_active: true }
    ];
    
    StorageProvider.findAll.mockResolvedValue(mockProviders);
    
    const result = await repository.getActiveProviders();
    
    expect(StorageProvider.findAll).toHaveBeenCalledWith({
      where: { is_active: true }
    });
    expect(result).toEqual(mockProviders);
  });

  test('getDefaultProvider should call findOne with correct parameters', async () => {
    const mockProvider = { id: 1, code: 's3', name: 'Amazon S3', is_default: true, is_active: true };
    
    StorageProvider.findOne.mockResolvedValue(mockProvider);
    
    const result = await repository.getDefaultProvider();
    
    expect(StorageProvider.findOne).toHaveBeenCalledWith({
      where: { is_default: true, is_active: true }
    });
    expect(result).toEqual(mockProvider);
  });

  test('setAsDefault should update all providers and set the specified one as default', async () => {
    const providerId = 2;
    const updateResult = [1]; // Number of affected rows
    
    StorageProvider.update.mockResolvedValue(updateResult);
    
    // Mock the update method
    repository.update = jest.fn().mockResolvedValue({ id: providerId, is_default: true });
    
    const result = await repository.setAsDefault(providerId);
    
    // Should first unset all defaults
    expect(StorageProvider.update).toHaveBeenCalledWith(
      { is_default: false },
      { where: { is_default: true } }
    );
    
    // Then set the new default
    expect(repository.update).toHaveBeenCalledWith(providerId, { is_default: true });
    
    expect(result).toEqual({ id: providerId, is_default: true });
  });

  test('updateConfiguration should call update with correct parameters', async () => {
    const providerId = 1;
    const configuration = { 
      bucket: 'my-bucket',
      region: 'us-east-1',
      accessKey: 'access-key'
    };
    
    // Mock the update method
    repository.update = jest.fn().mockResolvedValue({ 
      id: providerId, 
      configuration
    });
    
    const result = await repository.updateConfiguration(providerId, configuration);
    
    expect(repository.update).toHaveBeenCalledWith(providerId, { configuration });
    expect(result).toEqual({ 
      id: providerId, 
      configuration
    });
  });

  test('toggleActive should call update with correct parameters', async () => {
    const providerId = 1;
    const isActive = false;
    
    // Mock the update method
    repository.update = jest.fn().mockResolvedValue({ 
      id: providerId, 
      is_active: isActive
    });
    
    const result = await repository.toggleActive(providerId, isActive);
    
    expect(repository.update).toHaveBeenCalledWith(providerId, { is_active: isActive });
    expect(result).toEqual({ 
      id: providerId, 
      is_active: isActive
    });
  });
}); 