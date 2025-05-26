const tagController = require('../../../../src/api/controllers/content/tag.controller');
const { TagService } = require('../../../../src/services/content');
const { CustomError } = require('../../../../src/utils/error.util');

// Mock the TagService and CustomError
jest.mock('../../../../src/services/content/tag.service', () => ({
  createTag: jest.fn(),
  searchTags: jest.fn(),
  getTechnologyTags: jest.fn(),
  updateTag: jest.fn()
}));
jest.mock('../../../../src/utils/error.util');

describe('TagController', () => {
  let mockReq;
  let mockRes;
  let mockNext;
  
  beforeEach(() => {
    // Mock request, response, and next
    mockReq = {
      params: {
        id: 'tag-123'
      },
      query: {
        query: 'react'
      },
      body: {
        name: 'React',
        type: 'technology',
        color: '#61dafb'
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

  describe('createTag', () => {
    test('should create a tag successfully', async () => {
      const mockTag = {
        id: 'tag-123',
        name: 'React',
        type: 'technology',
        color: '#61dafb'
      };
      
      // Mock the createTag service method
      TagService.createTag.mockResolvedValue(mockTag);
      
      await tagController.createTag(mockReq, mockRes, mockNext);
      
      expect(TagService.createTag).toHaveBeenCalledWith(
        mockReq.body
      );
      
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockTag
      });
    });
    
    test('should call next with error on failure', async () => {
      const mockError = new Error('Failed to create tag');
      
      // Mock the createTag service method to throw an error
      TagService.createTag.mockRejectedValue(mockError);
      
      await tagController.createTag(mockReq, mockRes, mockNext);
      
      expect(TagService.createTag).toHaveBeenCalledWith(
        mockReq.body
      );
      
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('searchTags', () => {
    test('should search tags successfully', async () => {
      const mockTags = [
        { id: 'tag-1', name: 'React', type: 'technology' },
        { id: 'tag-2', name: 'React Native', type: 'technology' }
      ];
      
      // Mock the searchTags service method
      TagService.searchTags.mockResolvedValue(mockTags);
      
      await tagController.searchTags(mockReq, mockRes, mockNext);
      
      expect(TagService.searchTags).toHaveBeenCalledWith(
        mockReq.query.query
      );
      
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockTags
      });
    });
    
    test('should call next with error on failure', async () => {
      const mockError = new Error('Failed to search tags');
      
      // Mock the searchTags service method to throw an error
      TagService.searchTags.mockRejectedValue(mockError);
      
      await tagController.searchTags(mockReq, mockRes, mockNext);
      
      expect(TagService.searchTags).toHaveBeenCalledWith(
        mockReq.query.query
      );
      
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('getTechnologyTags', () => {
    test('should get technology tags successfully', async () => {
      const mockTags = [
        { id: 'tag-1', name: 'React', type: 'technology' },
        { id: 'tag-2', name: 'Node.js', type: 'technology' }
      ];
      
      // Mock the getTechnologyTags service method
      TagService.getTechnologyTags.mockResolvedValue(mockTags);
      
      await tagController.getTechnologyTags(mockReq, mockRes, mockNext);
      
      expect(TagService.getTechnologyTags).toHaveBeenCalled();
      
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockTags
      });
    });
    
    test('should call next with error on failure', async () => {
      const mockError = new Error('Failed to get technology tags');
      
      // Mock the getTechnologyTags service method to throw an error
      TagService.getTechnologyTags.mockRejectedValue(mockError);
      
      await tagController.getTechnologyTags(mockReq, mockRes, mockNext);
      
      expect(TagService.getTechnologyTags).toHaveBeenCalled();
      
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('updateTag', () => {
    test('should update a tag successfully', async () => {
      const mockTag = {
        id: 'tag-123',
        name: 'React Updated',
        type: 'technology',
        color: '#61dafb'
      };
      
      // Mock the updateTag service method
      TagService.updateTag.mockResolvedValue(mockTag);
      
      await tagController.updateTag(mockReq, mockRes, mockNext);
      
      expect(TagService.updateTag).toHaveBeenCalledWith(
        mockReq.params.id,
        mockReq.body
      );
      
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockTag
      });
    });
    
    test('should call next with error on failure', async () => {
      const mockError = new Error('Failed to update tag');
      
      // Mock the updateTag service method to throw an error
      TagService.updateTag.mockRejectedValue(mockError);
      
      await tagController.updateTag(mockReq, mockRes, mockNext);
      
      expect(TagService.updateTag).toHaveBeenCalledWith(
        mockReq.params.id,
        mockReq.body
      );
      
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });
}); 