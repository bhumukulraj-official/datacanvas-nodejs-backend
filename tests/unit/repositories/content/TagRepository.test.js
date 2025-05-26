const { TagRepository } = require('../../../../src/data/repositories/content');
const { Tag } = require('../../../../src/data/models');
const { Op } = require('sequelize');

// Mock the models
jest.mock('../../../../src/data/models', () => ({
  Tag: {
    findOne: jest.fn(),
    findAll: jest.fn()
  }
}));

// Mock sequelize Op
jest.mock('sequelize', () => ({
  Op: {
    or: Symbol('or'),
    iLike: Symbol('iLike')
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
  };
});

describe('TagRepository', () => {
  let repository;
  
  beforeEach(() => {
    repository = new TagRepository();
    jest.clearAllMocks();
  });

  test('findByName should call findOne with correct parameters', async () => {
    const name = 'JavaScript';
    const mockTag = { id: 1, name, slug: 'javascript' };
    
    Tag.findOne.mockResolvedValue(mockTag);
    
    const result = await repository.findByName(name);
    
    expect(Tag.findOne).toHaveBeenCalledWith({
      where: { name }
    });
    expect(result).toEqual(mockTag);
  });

  test('findBySlug should call findOne with correct parameters', async () => {
    const slug = 'javascript';
    const mockTag = { id: 1, name: 'JavaScript', slug };
    
    Tag.findOne.mockResolvedValue(mockTag);
    
    const result = await repository.findBySlug(slug);
    
    expect(Tag.findOne).toHaveBeenCalledWith({
      where: { slug }
    });
    expect(result).toEqual(mockTag);
  });

  test('findByCategory should call findAll with correct parameters', async () => {
    const category = 'programming';
    const mockTags = [
      { id: 1, name: 'JavaScript', category },
      { id: 2, name: 'Python', category }
    ];
    
    Tag.findAll.mockResolvedValue(mockTags);
    
    const result = await repository.findByCategory(category);
    
    expect(Tag.findAll).toHaveBeenCalledWith({
      where: { category }
    });
    expect(result).toEqual(mockTags);
  });

  test('getTechnologyTags should call findAll with correct parameters', async () => {
    const mockTags = [
      { id: 1, name: 'JavaScript', is_technology: true },
      { id: 2, name: 'React', is_technology: true }
    ];
    
    Tag.findAll.mockResolvedValue(mockTags);
    
    const result = await repository.getTechnologyTags();
    
    expect(Tag.findAll).toHaveBeenCalledWith({
      where: { is_technology: true }
    });
    expect(result).toEqual(mockTags);
  });

  test('searchTags should call findAll with correct parameters', async () => {
    const query = 'java';
    const mockTags = [
      { id: 1, name: 'JavaScript', slug: 'javascript' },
      { id: 2, name: 'Java', slug: 'java' }
    ];
    
    Tag.findAll.mockResolvedValue(mockTags);
    
    const result = await repository.searchTags(query);
    
    expect(Tag.findAll).toHaveBeenCalledWith({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: `%${query}%` } },
          { slug: { [Op.iLike]: `%${query}%` } }
        ]
      }
    });
    expect(result).toEqual(mockTags);
  });

  test('createIfNotExists should return existing tag when found', async () => {
    const tagData = { name: 'JavaScript', slug: 'javascript' };
    const mockTag = { id: 1, ...tagData };
    
    // Mock findByName to return existing tag
    repository.findByName = jest.fn().mockResolvedValue(mockTag);
    
    // Mock create to ensure it's not called
    repository.create = jest.fn();
    
    const result = await repository.createIfNotExists(tagData);
    
    expect(repository.findByName).toHaveBeenCalledWith(tagData.name);
    expect(repository.create).not.toHaveBeenCalled();
    expect(result).toEqual(mockTag);
  });

  test('createIfNotExists should create new tag when not found', async () => {
    const tagData = { name: 'JavaScript', slug: 'javascript' };
    const mockTag = { id: 1, ...tagData };
    
    // Mock findByName to return null (tag not found)
    repository.findByName = jest.fn().mockResolvedValue(null);
    
    // Mock create to return new tag
    repository.create = jest.fn().mockResolvedValue(mockTag);
    
    const result = await repository.createIfNotExists(tagData);
    
    expect(repository.findByName).toHaveBeenCalledWith(tagData.name);
    expect(repository.create).toHaveBeenCalledWith(tagData);
    expect(result).toEqual(mockTag);
  });
}); 