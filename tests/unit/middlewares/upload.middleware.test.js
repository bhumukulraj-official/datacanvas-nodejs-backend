const multer = require('multer');
const { CustomError } = require('../../../src/utils/error.util');

// Mock the multer library
jest.mock('multer', () => {
  // Create a mock storage that returns undefined
  const mockMemoryStorage = jest.fn().mockReturnValue('mockMemoryStorage');
  
  // Create a mock single function
  const mockSingle = jest.fn().mockImplementation((fieldName) => {
    return (req, res, next) => {
      if (req.simulateMulterError) {
        next(new Error('Multer error'));
      } else if (req.simulateNoFile) {
        next();
      } else {
        req.file = {
          originalname: 'test.jpg',
          mimetype: 'image/jpeg',
          size: 1024,
          buffer: Buffer.from('test file content')
        };
        next();
      }
    };
  });
  
  // Create a mock multer instance
  const mockMulter = jest.fn().mockImplementation(() => ({
    single: mockSingle
  }));
  
  // Add the memoryStorage method to the multer mock
  mockMulter.memoryStorage = mockMemoryStorage;
  
  return mockMulter;
});

// Mock FileService
jest.mock('../../../src/services/content', () => ({
  FileService: {
    createFileRecord: jest.fn().mockImplementation(async (fileData) => ({
      id: 'file-123',
      ...fileData
    }))
  }
}));

describe('Upload Middleware', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('processUpload', () => {
    // Import modules after mocks are set up
    let upload, processUpload, FileService;
    
    beforeEach(() => {
      // Clear module cache
      jest.resetModules();
      
      // Re-import modules
      const uploadMiddleware = require('../../../src/api/middlewares/upload.middleware');
      upload = uploadMiddleware.upload;
      processUpload = uploadMiddleware.processUpload;
      FileService = require('../../../src/services/content').FileService;
    });

    it('should create a middleware array with correct functions', () => {
      const middleware = processUpload('avatar');
      
      // Should return an array with 2 items
      expect(Array.isArray(middleware)).toBe(true);
      expect(middleware).toHaveLength(2);
      
      // Second item should be a function
      expect(typeof middleware[1]).toBe('function');
    });

    it('should save file to database when file is uploaded', async () => {
      // Create mock request, response and next
      const req = {};
      const res = {};
      const next = jest.fn();
      
      // Get the second middleware function (file processor)
      const processor = processUpload('avatar')[1];
      
      // Add file to request (multer would do this)
      req.file = {
        originalname: 'profile.jpg',
        mimetype: 'image/jpeg',
        size: 2048,
        buffer: Buffer.from('image data')
      };
      
      // Call the processor
      await processor(req, res, next);
      
      // Verify FileService was called
      expect(FileService.createFileRecord).toHaveBeenCalledWith({
        original_name: 'profile.jpg',
        mime_type: 'image/jpeg',
        size: 2048,
        buffer: expect.any(Buffer)
      });
      
      // File record should be assigned to req.file
      expect(req.file).toHaveProperty('id', 'file-123');
      
      // Next should be called
      expect(next).toHaveBeenCalled();
    });

    it('should skip file processing if no file was uploaded', async () => {
      // Create mock request, response and next
      const req = {};
      const res = {};
      const next = jest.fn();
      
      // Get the second middleware function (file processor)
      const processor = processUpload('avatar')[1];
      
      // Call the processor without a file
      await processor(req, res, next);
      
      // FileService should not be called
      expect(FileService.createFileRecord).not.toHaveBeenCalled();
      
      // Next should be called
      expect(next).toHaveBeenCalled();
    });

    it('should pass errors to next middleware', async () => {
      // Create mock request, response and next
      const req = { file: { originalname: 'test.jpg' } };
      const res = {};
      const next = jest.fn();
      
      // Make FileService throw an error
      const error = new Error('Database error');
      FileService.createFileRecord.mockRejectedValueOnce(error);
      
      // Get the second middleware function (file processor)
      const processor = processUpload('avatar')[1];
      
      // Call the processor
      await processor(req, res, next);
      
      // Next should be called with the error
      expect(next).toHaveBeenCalledWith(error);
    });
  });
}); 