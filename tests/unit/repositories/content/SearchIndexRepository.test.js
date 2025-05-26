const { SearchIndexRepository } = require('../../../../src/data/repositories/content');
const { SearchIndex } = require('../../../../src/data/models');
const sequelize = require('../../../../src/config/database');

// Mock the models
jest.mock('../../../../src/data/models', () => ({
  SearchIndex: {
    findOne: jest.fn(),
    destroy: jest.fn()
  }
}));

// Mock sequelize
jest.mock('../../../../src/config/database', () => ({
  query: jest.fn()
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

describe('SearchIndexRepository', () => {
  let repository;
  
  beforeEach(() => {
    repository = new SearchIndexRepository();
    jest.clearAllMocks();
  });

  test('getByEntityTypeAndId should call findOne with correct parameters', async () => {
    const entityType = 'project';
    const entityId = 5;
    const mockIndex = { id: 1, entity_type: entityType, entity_id: entityId };
    
    SearchIndex.findOne.mockResolvedValue(mockIndex);
    
    const result = await repository.getByEntityTypeAndId(entityType, entityId);
    
    expect(SearchIndex.findOne).toHaveBeenCalledWith({
      where: { entity_type: entityType, entity_id: entityId }
    });
    expect(result).toEqual(mockIndex);
  });

  test('updateSearchVector should update existing record when found', async () => {
    const entityType = 'project';
    const entityId = 5;
    const searchVector = 'project document text';
    const metadata = { title: 'Project Title' };
    
    const mockIndex = { id: 1, entity_type: entityType, entity_id: entityId, metadata: { status: 'active' } };
    const updatedIndex = { 
      id: 1, 
      search_vector: searchVector,
      metadata: { status: 'active', title: 'Project Title' }
    };
    
    // Mock getByEntityTypeAndId to return existing record
    repository.getByEntityTypeAndId = jest.fn().mockResolvedValue(mockIndex);
    
    // Mock update method
    repository.update = jest.fn().mockResolvedValue(updatedIndex);
    
    const result = await repository.updateSearchVector(entityType, entityId, searchVector, metadata);
    
    expect(repository.getByEntityTypeAndId).toHaveBeenCalledWith(entityType, entityId);
    expect(repository.update).toHaveBeenCalledWith(1, { 
      search_vector: searchVector,
      metadata: { status: 'active', title: 'Project Title' }
    });
    expect(result).toEqual(updatedIndex);
  });

  test('updateSearchVector should create new record when not found', async () => {
    const entityType = 'project';
    const entityId = 5;
    const searchVector = 'project document text';
    const metadata = { title: 'Project Title' };
    
    const newIndex = { 
      id: 1, 
      entity_type: entityType,
      entity_id: entityId,
      search_vector: searchVector,
      metadata
    };
    
    // Mock getByEntityTypeAndId to return null (record not found)
    repository.getByEntityTypeAndId = jest.fn().mockResolvedValue(null);
    
    // Mock create method
    repository.create = jest.fn().mockResolvedValue(newIndex);
    
    const result = await repository.updateSearchVector(entityType, entityId, searchVector, metadata);
    
    expect(repository.getByEntityTypeAndId).toHaveBeenCalledWith(entityType, entityId);
    expect(repository.create).toHaveBeenCalledWith({
      entity_type: entityType,
      entity_id: entityId,
      search_vector: searchVector,
      metadata
    });
    expect(result).toEqual(newIndex);
  });

  test('search should call sequelize query with correct parameters', async () => {
    const query = 'project document';
    const entityTypes = ['project', 'document'];
    const options = { limit: 5, offset: 10 };
    
    const mockResults = [
      { id: 1, entity_type: 'project', entity_id: 5 },
      { id: 2, entity_type: 'document', entity_id: 3 }
    ];
    
    sequelize.query.mockResolvedValue(mockResults);
    
    const result = await repository.search(query, entityTypes, options);
    
    expect(sequelize.query).toHaveBeenCalledWith(
      expect.stringContaining(`SELECT * FROM content.search_index`),
      expect.objectContaining({
        replacements: {
          query: 'project & document',
          entityTypes: ['project', 'document'],
          limit: 5,
          offset: 10
        },
        type: expect.any(Object),
        model: SearchIndex
      })
    );
    expect(result).toEqual(mockResults);
  });

  test('search should use default limit and offset when not provided', async () => {
    const query = 'project';
    const entityTypes = [];
    
    const mockResults = [
      { id: 1, entity_type: 'project', entity_id: 5 }
    ];
    
    sequelize.query.mockResolvedValue(mockResults);
    
    const result = await repository.search(query, entityTypes);
    
    expect(sequelize.query).toHaveBeenCalledWith(
      expect.stringContaining(`SELECT * FROM content.search_index`),
      expect.objectContaining({
        replacements: {
          query: 'project',
          limit: 20,
          offset: 0
        },
        type: expect.any(Object),
        model: SearchIndex
      })
    );
    expect(result).toEqual(mockResults);
  });

  test('deleteByEntityTypeAndId should call destroy with correct parameters', async () => {
    const entityType = 'project';
    const entityId = 5;
    const deleteCount = 1;
    
    SearchIndex.destroy.mockResolvedValue(deleteCount);
    
    const result = await repository.deleteByEntityTypeAndId(entityType, entityId);
    
    expect(SearchIndex.destroy).toHaveBeenCalledWith({
      where: { entity_type: entityType, entity_id: entityId }
    });
    expect(result).toEqual(deleteCount);
  });
}); 