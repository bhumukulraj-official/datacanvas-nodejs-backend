const fileService = require('../../../../src/services/content/file.service');
const { FileUploadRepository } = require('../../../../src/data/repositories/content');
const { s3 } = require('../../../../src/config');
const { CustomError } = require('../../../../src/utils/error.util');
const logger = require('../../../../src/utils/logger.util');

// Mock the repository
jest.mock('../../../../src/data/repositories/content', () => ({
  FileUploadRepository: jest.fn()
}));

// Mock S3
jest.mock('../../../../src/config', () => ({
  s3: {
    getBucket: jest.fn()
  }
}));

// Mock logger
jest.mock('../../../../src/utils/logger.util', () => ({
  info: jest.fn(),
  error: jest.fn()
}));

describe('FileService', () => {
  let mockFileUploadRepository;
  
  beforeEach(() => {
    // Create new instance of mocked repository
    mockFileUploadRepository = new FileUploadRepository();
    
    // Reset mock implementations
    jest.clearAllMocks();
    
    // Mock repository on the service
    fileService.fileUploadRepo = mockFileUploadRepository;
  });

  describe('createFileRecord', () => {
    test('should create a file record successfully', async () => {
      // Mock file data
      const fileData = {
        name: 'test-file.jpg',
        size: 1024,
        mime_type: 'image/jpeg',
        s3_key: 'uploads/test-file.jpg',
        is_public: true,
        user_id: 1
      };
      
      // Mock created file
      const mockFile = {
        id: 1,
        uuid: 'test-uuid',
        ...fileData,
        created_at: new Date()
      };
      
      mockFileUploadRepository.create = jest.fn().mockResolvedValue(mockFile);
      
      // Call the service method
      const result = await fileService.createFileRecord(fileData);
      
      // Assertions
      expect(mockFileUploadRepository.create).toHaveBeenCalledWith(fileData);
      expect(result).toEqual(mockFile);
      expect(logger.info).toHaveBeenCalled();
    });
    
    test('should throw error if create fails', async () => {
      // Mock file data
      const fileData = {
        name: 'test-file.jpg',
        size: 1024,
        mime_type: 'image/jpeg',
        s3_key: 'uploads/test-file.jpg',
        is_public: true,
        user_id: 1
      };
      
      // Mock create to throw error
      const mockError = new Error('Database error');
      mockFileUploadRepository.create = jest.fn().mockRejectedValue(mockError);
      
      // Call the service method and expect it to throw
      await expect(
        fileService.createFileRecord(fileData)
      ).rejects.toThrow(CustomError);
      
      // Assertions
      expect(mockFileUploadRepository.create).toHaveBeenCalledWith(fileData);
      expect(logger.error).toHaveBeenCalledWith('Error creating file record:', mockError);
    });
  });

  describe('getFileByUuid', () => {
    test('should get a file by UUID', async () => {
      // Mock file
      const mockFile = {
        id: 1,
        uuid: 'test-uuid',
        name: 'test-file.jpg',
        size: 1024,
        mime_type: 'image/jpeg',
        s3_key: 'uploads/test-file.jpg',
        is_public: true,
        user_id: 1,
        created_at: new Date()
      };
      
      mockFileUploadRepository.getByUuid = jest.fn().mockResolvedValue(mockFile);
      
      // Call the service method
      const result = await fileService.getFileByUuid('test-uuid');
      
      // Assertions
      expect(mockFileUploadRepository.getByUuid).toHaveBeenCalledWith('test-uuid');
      expect(result).toEqual(mockFile);
    });
    
    test('should throw error if file not found', async () => {
      mockFileUploadRepository.getByUuid = jest.fn().mockResolvedValue(null);
      
      // Call the service method and expect it to throw
      await expect(
        fileService.getFileByUuid('non-existent-uuid')
      ).rejects.toThrow(CustomError);
      
      // Assertions
      expect(mockFileUploadRepository.getByUuid).toHaveBeenCalledWith('non-existent-uuid');
    });
  });

  describe('markFileAsClean', () => {
    test('should mark file as clean', async () => {
      // Mock update
      const mockUpdatedFile = {
        id: 1,
        uuid: 'test-uuid',
        virus_scan_status: 'clean',
        updated_at: new Date()
      };
      
      mockFileUploadRepository.updateVirusScanStatus = jest.fn().mockResolvedValue(mockUpdatedFile);
      
      // Call the service method
      const result = await fileService.markFileAsClean('test-uuid');
      
      // Assertions
      expect(mockFileUploadRepository.updateVirusScanStatus).toHaveBeenCalledWith('test-uuid', 'clean');
      expect(result).toEqual(mockUpdatedFile);
    });
  });

  describe('deleteFile', () => {
    test('should delete a file', async () => {
      // Mock file
      const mockFile = {
        id: 1,
        uuid: 'test-uuid',
        name: 'test-file.jpg',
        s3_key: 'uploads/test-file.jpg',
        is_public: true
      };
      
      // Mock getFileByUuid
      const getFileByUuidSpy = jest.spyOn(fileService, 'getFileByUuid')
        .mockResolvedValue(mockFile);
      
      // Mock S3 bucket
      s3.getBucket.mockReturnValue('test-bucket');
      
      // Mock DeleteObjectCommand and s3Client
      const mockDeleteObjectCommand = jest.fn();
      const mockS3Client = {
        send: jest.fn().mockResolvedValue({})
      };
      
      // Add these mocks to the global scope
      global.DeleteObjectCommand = mockDeleteObjectCommand;
      global.s3Client = mockS3Client;
      
      // Mock markAsDeleted
      mockFileUploadRepository.markAsDeleted = jest.fn().mockResolvedValue(true);
      
      // Call the service method
      const result = await fileService.deleteFile('test-uuid');
      
      // Assertions
      expect(getFileByUuidSpy).toHaveBeenCalledWith('test-uuid');
      expect(mockFileUploadRepository.markAsDeleted).toHaveBeenCalledWith('test-uuid');
      expect(s3.getBucket).toHaveBeenCalledWith(true);
      expect(mockDeleteObjectCommand).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: 'uploads/test-file.jpg'
      });
      expect(mockS3Client.send).toHaveBeenCalled();
      expect(result).toBe(true);
      
      // Restore the spy and delete global mocks
      getFileByUuidSpy.mockRestore();
      delete global.DeleteObjectCommand;
      delete global.s3Client;
    });
  });
}); 