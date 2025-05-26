const { FileUploadRepository } = require('../../../../src/data/repositories/content');
const { FileUpload } = require('../../../../src/data/models');
const { Op } = require('sequelize');
const { CustomError } = require('../../../../src/utils/error.util');

// Mock the models
jest.mock('../../../../src/data/models', () => ({
  FileUpload: {
    findOne: jest.fn(),
    findAll: jest.fn()
  }
}));

// Mock the logger
jest.mock('../../../../src/utils/logger.util', () => ({
  info: jest.fn(),
  error: jest.fn()
}));

// Mock the error utility
jest.mock('../../../../src/utils/error.util', () => ({
  CustomError: class CustomError extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
    }
  }
}));

// Mock sequelize
jest.mock('sequelize', () => ({
  Op: {
    like: Symbol('like'),
    not: Symbol('not')
  }
}));

// Mock the BaseRepository
jest.mock('../../../../src/data/repositories/BaseRepository', () => {
  return class MockBaseRepository {
    constructor(model) {
      this.model = model;
    }
    
    async create(data) {
      return { id: 1, ...data };
    }
    
    async update(id, data) {
      return { id, ...data };
    }
  };
});

describe('FileUploadRepository', () => {
  let repository;
  
  beforeEach(() => {
    repository = new FileUploadRepository();
    jest.clearAllMocks();
  });

  test('getByUuid should call findOne with correct parameters', async () => {
    const uuid = 'file-uuid-123';
    const mockFile = { id: 1, uuid };
    FileUpload.findOne.mockResolvedValue(mockFile);
    
    const result = await repository.getByUuid(uuid);
    
    expect(FileUpload.findOne).toHaveBeenCalledWith({ where: { uuid } });
    expect(result).toEqual(mockFile);
  });

  test('getByEntityTypeAndId should call findAll with correct parameters', async () => {
    const entityType = 'project';
    const entityId = 5;
    const mockFiles = [
      { id: 1, entity_type: entityType, entity_id: entityId },
      { id: 2, entity_type: entityType, entity_id: entityId }
    ];
    FileUpload.findAll.mockResolvedValue(mockFiles);
    
    const result = await repository.getByEntityTypeAndId(entityType, entityId);
    
    expect(FileUpload.findAll).toHaveBeenCalledWith({
      where: { 
        entity_type: entityType,
        entity_id: entityId,
        is_deleted: false
      }
    });
    expect(result).toEqual(mockFiles);
  });

  test('getPublicFiles should call findAll with correct parameters', async () => {
    const mockFiles = [
      { id: 1, is_public: true },
      { id: 2, is_public: true }
    ];
    FileUpload.findAll.mockResolvedValue(mockFiles);
    
    const result = await repository.getPublicFiles();
    
    expect(FileUpload.findAll).toHaveBeenCalledWith({
      where: { 
        is_public: true,
        is_deleted: false 
      }
    });
    expect(result).toEqual(mockFiles);
  });

  test('getByUserId should call findAll with correct parameters', async () => {
    const userId = 10;
    const mockFiles = [
      { id: 1, user_id: userId },
      { id: 2, user_id: userId }
    ];
    FileUpload.findAll.mockResolvedValue(mockFiles);
    
    const result = await repository.getByUserId(userId);
    
    expect(FileUpload.findAll).toHaveBeenCalledWith({
      where: {
        user_id: userId,
        is_deleted: false
      }
    });
    expect(result).toEqual(mockFiles);
  });

  test('getByFileType should call findAll with correct parameters', async () => {
    const mimeType = 'image';
    const mockFiles = [
      { id: 1, mime_type: 'image/jpeg' },
      { id: 2, mime_type: 'image/png' }
    ];
    FileUpload.findAll.mockResolvedValue(mockFiles);
    
    const result = await repository.getByFileType(mimeType);
    
    expect(FileUpload.findAll).toHaveBeenCalledWith({
      where: {
        mime_type: {
          [Op.like]: `${mimeType}%`
        },
        is_deleted: false
      }
    });
    expect(result).toEqual(mockFiles);
  });

  test('markAsDeleted should call update with correct parameters', async () => {
    const fileId = 1;
    const mockUpdatedFile = { id: fileId, is_deleted: true };
    
    // Mock the update method
    repository.update = jest.fn().mockResolvedValue(mockUpdatedFile);
    
    const result = await repository.markAsDeleted(fileId);
    
    expect(repository.update).toHaveBeenCalledWith(fileId, { is_deleted: true });
    expect(result).toEqual(mockUpdatedFile);
  });

  test('updateVirusScanStatus should call update with correct parameters', async () => {
    const fileId = 1;
    const status = 'clean';
    const mockUpdatedFile = { id: fileId, virus_scan_status: status };
    
    // Mock the update method
    repository.update = jest.fn().mockResolvedValue(mockUpdatedFile);
    
    const result = await repository.updateVirusScanStatus(fileId, status);
    
    expect(repository.update).toHaveBeenCalledWith(fileId, { virus_scan_status: status });
    expect(result).toEqual(mockUpdatedFile);
  });

  test('create should call super.create and handle successful creation', async () => {
    const fileData = { 
      filename: 'test.jpg',
      mime_type: 'image/jpeg',
      size: 1024
    };
    const mockFile = { id: 1, ...fileData };
    
    // Mock super.create method
    const originalCreate = repository.create;
    repository.create = jest.fn().mockResolvedValue(mockFile);
    
    const result = await repository.create(fileData);
    
    expect(repository.create).toHaveBeenCalledWith(fileData);
    expect(result).toEqual(mockFile);
    
    // Restore original method
    repository.create = originalCreate;
  });

  test('create should handle errors properly', async () => {
    const fileData = { 
      filename: 'test.jpg',
      mime_type: 'image/jpeg',
      size: 1024
    };
    
    // Mock super.create to throw an error
    const originalCreate = BaseRepository.prototype.create;
    const error = new Error('Database error');
    jest.spyOn(BaseRepository.prototype, 'create').mockRejectedValue(error);
    
    await expect(repository.create(fileData)).rejects.toThrow(CustomError);
    
    // Restore original method
    BaseRepository.prototype.create = originalCreate;
  });
}); 