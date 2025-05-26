const searchController = require('../../../../src/api/controllers/content/search.controller');
const { SearchService } = require('../../../../src/services/content');

// Mock the SearchService
jest.mock('../../../../src/services/content/search.service', () => ({
  searchProjects: jest.fn(),
  indexProject: jest.fn()
}));

describe('SearchController', () => {
  let mockReq;
  let mockRes;
  let mockNext;
  
  beforeEach(() => {
    // Mock request, response, and next
    mockReq = {
      query: {
        q: 'react project'
      },
      params: {
        projectId: 'project-123'
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

  describe('searchProjects', () => {
    test('should search projects successfully', async () => {
      const mockResults = [
        { id: 'project-1', title: 'React Portfolio', score: 0.95 },
        { id: 'project-2', title: 'React Dashboard', score: 0.85 }
      ];
      
      // Mock the searchProjects service method
      SearchService.searchProjects.mockResolvedValue(mockResults);
      
      await searchController.searchProjects(mockReq, mockRes, mockNext);
      
      expect(SearchService.searchProjects).toHaveBeenCalledWith(
        mockReq.query.q
      );
      
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockResults
      });
    });
    
    test('should call next with error on failure', async () => {
      const mockError = new Error('Failed to search projects');
      
      // Mock the searchProjects service method to throw an error
      SearchService.searchProjects.mockRejectedValue(mockError);
      
      await searchController.searchProjects(mockReq, mockRes, mockNext);
      
      expect(SearchService.searchProjects).toHaveBeenCalledWith(
        mockReq.query.q
      );
      
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('indexProject', () => {
    test('should index project successfully', async () => {
      // Mock the indexProject service method
      SearchService.indexProject.mockResolvedValue({ indexed: true });
      
      await searchController.indexProject(mockReq, mockRes, mockNext);
      
      expect(SearchService.indexProject).toHaveBeenCalledWith(
        mockReq.params.projectId
      );
      
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Project indexed successfully'
      });
    });
    
    test('should call next with error on failure', async () => {
      const mockError = new Error('Failed to index project');
      
      // Mock the indexProject service method to throw an error
      SearchService.indexProject.mockRejectedValue(mockError);
      
      await searchController.indexProject(mockReq, mockRes, mockNext);
      
      expect(SearchService.indexProject).toHaveBeenCalledWith(
        mockReq.params.projectId
      );
      
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });
}); 