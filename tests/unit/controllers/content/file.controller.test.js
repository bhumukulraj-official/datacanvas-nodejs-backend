const fileController = require('../../../../src/api/controllers/content/file.controller');
const { FileService } = require('../../../../src/services/content');

// Mock the FileService
jest.mock('../../../../src/services/content/file.service', () => ({
  createFileRecord: jest.fn(),
  getFileByUuid: jest.fn()
}));

describe('FileController', () => {
  let mockReq;
  let mockRes;
  let mockNext;
  
  beforeEach(() => {
    // Mock request, response, and next
    mockReq = {
      user: { id: 'user-123' },
      file: {
        filename: 'test-file.jpg',
        path: '/uploads/test-file.jpg',
        mimetype: 'image/jpeg',
        size: 12345
      },
      params: {
        fileId: 'file-123'
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

  describe('uploadFile', () => {
    test('should upload file successfully', async () => {
      const mockFile = {
        id: 'file-123',
        uuid: 'file-uuid-123',
        filename: 'test-file.jpg',
        path: '/uploads/test-file.jpg',
        mimetype: 'image/jpeg',
        size: 12345,
        user_id: 'user-123'
      };
      
      // Mock the createFileRecord service method
      FileService.createFileRecord.mockResolvedValue(mockFile);
      
      await fileController.uploadFile(mockReq, mockRes, mockNext);
      
      expect(FileService.createFileRecord).toHaveBeenCalledWith({
        ...mockReq.file,
        user_id: mockReq.user.id
      });
      
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockFile
      });
    });
    
    test('should call next with error on failure', async () => {
      const mockError = new Error('Failed to upload file');
      
      // Mock the createFileRecord service method to throw an error
      FileService.createFileRecord.mockRejectedValue(mockError);
      
      await fileController.uploadFile(mockReq, mockRes, mockNext);
      
      expect(FileService.createFileRecord).toHaveBeenCalledWith({
        ...mockReq.file,
        user_id: mockReq.user.id
      });
      
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('getFile', () => {
    test('should get file successfully', async () => {
      const mockFile = {
        id: 'file-123',
        uuid: 'file-uuid-123',
        filename: 'test-file.jpg',
        path: '/uploads/test-file.jpg',
        mimetype: 'image/jpeg',
        size: 12345,
        user_id: 'user-123'
      };
      
      // Mock the getFileByUuid service method
      FileService.getFileByUuid.mockResolvedValue(mockFile);
      
      await fileController.getFile(mockReq, mockRes, mockNext);
      
      expect(FileService.getFileByUuid).toHaveBeenCalledWith(
        mockReq.params.fileId
      );
      
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockFile
      });
    });
    
    test('should call next with error on failure', async () => {
      const mockError = new Error('Failed to get file');
      
      // Mock the getFileByUuid service method to throw an error
      FileService.getFileByUuid.mockRejectedValue(mockError);
      
      await fileController.getFile(mockReq, mockRes, mockNext);
      
      expect(FileService.getFileByUuid).toHaveBeenCalledWith(
        mockReq.params.fileId
      );
      
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });
}); 