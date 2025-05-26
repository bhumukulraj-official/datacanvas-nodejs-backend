const tagService = require('../../../../src/services/content/tag.service');
const { TagRepository } = require('../../../../src/data/repositories/content');
const { validation } = require('../../../../src/utils/validation.util');
const { CustomError } = require('../../../../src/utils/error.util');
const logger = require('../../../../src/utils/logger.util');

// Mock the repository
jest.mock('../../../../src/data/repositories/content', () => ({
  TagRepository: jest.fn()
}));

// Mock validation utility
jest.mock('../../../../src/utils/validation.util', () => ({
  validation: {
    slugify: jest.fn()
  }
}));

// Mock logger
jest.mock('../../../../src/utils/logger.util', () => ({
  info: jest.fn(),
  error: jest.fn()
}));

describe('TagService', () => {
  let mockTagRepository;
  
  beforeEach(() => {
    // Create new instance of mocked repository
    mockTagRepository = new TagRepository();
    
    // Reset mock implementations
    jest.clearAllMocks();
    
    // Initialize mock methods
    mockTagRepository.create = jest.fn();
    mockTagRepository.findById = jest.fn();
    
    // Mock repository on the service
    tagService.tagRepo = mockTagRepository;
  });

  describe('createTag', () => {
    test('should create a new tag successfully', async () => {
      // Mock tag data
      const tagData = {
        name: 'React JS',
        type: 'technology'
      };
      
      // Mock findByName to return null (no existing tag)
      mockTagRepository.findByName = jest.fn().mockResolvedValue(null);
      
      // Mock slugify
      validation.slugify.mockReturnValue('react-js');
      
      // Mock created tag
      const mockTag = {
        id: 1,
        name: 'React JS',
        slug: 'react-js',
        type: 'technology',
        created_at: new Date()
      };
      
      mockTagRepository.create = jest.fn().mockResolvedValue(mockTag);
      
      // Call the service method
      const result = await tagService.createTag(tagData);
      
      // Assertions
      expect(mockTagRepository.findByName).toHaveBeenCalledWith('React JS');
      expect(validation.slugify).toHaveBeenCalledWith('React JS');
      expect(mockTagRepository.create).toHaveBeenCalledWith({
        ...tagData,
        slug: 'react-js'
      });
      expect(result).toEqual(mockTag);
    });
    
    test('should throw error if tag already exists', async () => {
      // Mock tag data
      const tagData = {
        name: 'React JS',
        type: 'technology'
      };
      
      // Mock findByName to return an existing tag
      const existingTag = {
        id: 1,
        name: 'React JS',
        slug: 'react-js',
        type: 'technology'
      };
      
      mockTagRepository.findByName = jest.fn().mockResolvedValue(existingTag);
      
      // Call the service method and expect it to throw
      await expect(
        tagService.createTag(tagData)
      ).rejects.toThrow(CustomError);
      
      // Assertions
      expect(mockTagRepository.findByName).toHaveBeenCalledWith('React JS');
      expect(validation.slugify).not.toHaveBeenCalled();
      expect(mockTagRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('searchTags', () => {
    test('should search tags by query', async () => {
      // Mock search results
      const mockTags = [
        {
          id: 1,
          name: 'React JS',
          slug: 'react-js',
          type: 'technology'
        },
        {
          id: 2,
          name: 'React Native',
          slug: 'react-native',
          type: 'technology'
        }
      ];
      
      mockTagRepository.searchTags = jest.fn().mockResolvedValue(mockTags);
      
      // Call the service method
      const result = await tagService.searchTags('react');
      
      // Assertions
      expect(mockTagRepository.searchTags).toHaveBeenCalledWith('react');
      expect(result).toEqual(mockTags);
    });
  });

  describe('getTechnologyTags', () => {
    test('should return technology tags', async () => {
      // Mock technology tags
      const mockTags = [
        {
          id: 1,
          name: 'React JS',
          slug: 'react-js',
          type: 'technology'
        },
        {
          id: 2,
          name: 'Node.js',
          slug: 'nodejs',
          type: 'technology'
        }
      ];
      
      mockTagRepository.getTechnologyTags = jest.fn().mockResolvedValue(mockTags);
      
      // Call the service method
      const result = await tagService.getTechnologyTags();
      
      // Assertions
      expect(mockTagRepository.getTechnologyTags).toHaveBeenCalled();
      expect(result).toEqual(mockTags);
    });
  });

  describe('updateTag', () => {
    test('should update a tag successfully', async () => {
      // Mock update data
      const updateData = {
        name: 'Updated Tag'
      };
      
      // Mock update to return affected count
      mockTagRepository.update = jest.fn().mockResolvedValue([1]);
      
      // Mock updated tag
      const mockUpdatedTag = {
        id: 1,
        name: 'Updated Tag',
        slug: 'updated-tag',
        type: 'technology',
        updated_at: new Date()
      };
      
      mockTagRepository.findById = jest.fn().mockResolvedValue(mockUpdatedTag);
      
      // Call the service method
      const result = await tagService.updateTag(1, updateData);
      
      // Assertions
      expect(mockTagRepository.update).toHaveBeenCalledWith(1, updateData);
      expect(mockTagRepository.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUpdatedTag);
    });
    
    test('should throw error if tag not found', async () => {
      // Mock update to return 0 affected rows (tag not found)
      mockTagRepository.update = jest.fn().mockResolvedValue([0]);
      
      // Call the service method and expect it to throw
      await expect(
        tagService.updateTag(999, { name: 'New Name' })
      ).rejects.toThrow(CustomError);
      
      // Assertions
      expect(mockTagRepository.update).toHaveBeenCalledWith(999, { name: 'New Name' });
      expect(mockTagRepository.findById).not.toHaveBeenCalled();
    });
  });
}); 