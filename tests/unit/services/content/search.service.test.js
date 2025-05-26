const searchService = require('../../../../src/services/content/search.service');
const { SearchIndexRepository, ProjectRepository } = require('../../../../src/data/repositories/content');
const { CustomError } = require('../../../../src/utils/error.util');
const logger = require('../../../../src/utils/logger.util');

// Mock the repositories
jest.mock('../../../../src/data/repositories/content', () => ({
  SearchIndexRepository: jest.fn(),
  ProjectRepository: jest.fn()
}));

// Mock logger
jest.mock('../../../../src/utils/logger.util', () => ({
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}));

describe('SearchService', () => {
  let mockSearchIndexRepository;
  let mockProjectRepository;
  
  beforeEach(() => {
    // Create new instances of mocked repositories
    mockSearchIndexRepository = new SearchIndexRepository();
    mockProjectRepository = new ProjectRepository();
    
    // Reset mock implementations
    jest.clearAllMocks();
    
    // Mock repositories on the service
    searchService.searchIndexRepo = mockSearchIndexRepository;
    searchService.projectRepo = mockProjectRepository;
  });

  describe('searchProjects', () => {
    test('should search projects successfully', async () => {
      // Mock search results
      const mockSearchResults = [
        {
          id: 1,
          title: 'React Project',
          type: 'project',
          relevance: 0.8
        },
        {
          id: 2,
          title: 'Node.js API',
          type: 'project',
          relevance: 0.6
        }
      ];
      
      mockSearchIndexRepository.search = jest.fn().mockResolvedValue(mockSearchResults);
      
      // Call the service method
      const result = await searchService.searchProjects('react');
      
      // Assertions
      expect(mockSearchIndexRepository.search).toHaveBeenCalledWith('react', ['project']);
      expect(logger.debug).toHaveBeenCalledWith('Searching projects for query: react');
      expect(result).toEqual(mockSearchResults);
    });
    
    test('should throw error if search fails', async () => {
      mockSearchIndexRepository.search = jest.fn().mockRejectedValue(new Error('Search error'));
      
      // Call the service method and expect it to throw
      await expect(
        searchService.searchProjects('react')
      ).rejects.toThrow(CustomError);
      
      // Assertions
      expect(mockSearchIndexRepository.search).toHaveBeenCalledWith('react', ['project']);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('indexProject', () => {
    test('should index a project successfully', async () => {
      // Mock project
      const mockProject = {
        id: 1,
        title: 'Test Project',
        description: 'A test project with React',
        tags: [
          { name: 'react' },
          { name: 'javascript' }
        ],
        skills: [
          { name: 'React' },
          { name: 'Node.js' }
        ],
        category: 'web'
      };
      
      mockProjectRepository.findById = jest.fn().mockResolvedValue(mockProject);
      
      // Mock index update
      const mockIndexUpdate = {
        id: 1,
        entity_type: 'project',
        entity_id: 1,
        search_vector: 'Test Project A test project with React react javascript React Node.js',
        metadata: { category: 'web' }
      };
      
      mockSearchIndexRepository.updateSearchVector = jest.fn().mockResolvedValue(mockIndexUpdate);
      
      // Call the service method
      const result = await searchService.indexProject(1);
      
      // Assertions
      expect(mockProjectRepository.findById).toHaveBeenCalledWith(1, {
        include: ['tags', 'skills']
      });
      
      expect(mockSearchIndexRepository.updateSearchVector).toHaveBeenCalledWith(
        'project',
        1,
        'Test Project A test project with React react javascript React Node.js',
        { category: 'web' }
      );
      
      expect(logger.info).toHaveBeenCalledWith('Indexing project ID: 1');
      expect(result).toEqual(mockIndexUpdate);
    });
    
    test('should throw error if indexing fails', async () => {
      mockProjectRepository.findById = jest.fn().mockRejectedValue(new Error('DB error'));
      
      // Call the service method and expect it to throw
      await expect(
        searchService.indexProject(1)
      ).rejects.toThrow(CustomError);
      
      // Assertions
      expect(mockProjectRepository.findById).toHaveBeenCalledWith(1, {
        include: ['tags', 'skills']
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });
}); 