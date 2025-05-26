const { ProjectRepository } = require('../../../../src/data/repositories/content');
const { Project } = require('../../../../src/data/models');
const sequelize = require('sequelize');

// Mock the model and BaseRepository methods
jest.mock('../../../../src/data/models', () => ({
  Project: {
    findAll: jest.fn()
  }
}));

// Mock sequelize
jest.mock('sequelize', () => ({
  literal: jest.fn(str => str)
}));

// Mock the BaseRepository
jest.mock('../../../../src/data/repositories/BaseRepository', () => {
  return class MockBaseRepository {
    constructor(model) {
      this.model = model;
    }
  };
});

describe('ProjectRepository', () => {
  let repository;
  
  beforeEach(() => {
    repository = new ProjectRepository();
    jest.clearAllMocks();
  });

  test('getFeaturedProjects should filter by featured flag', async () => {
    const mockProjects = [
      { id: 1, title: 'Project 1', is_featured: true },
      { id: 2, title: 'Project 2', is_featured: true }
    ];
    Project.findAll.mockResolvedValue(mockProjects);

    const result = await repository.getFeaturedProjects();
    
    expect(Project.findAll).toHaveBeenCalledWith({
      where: { 
        is_featured: true,
        is_deleted: false 
      },
      include: ['ProjectStatus'],
      order: [['created_at', 'DESC']]
    });
    expect(result).toEqual(mockProjects);
  });

  test('getByVisibility should filter by visibility parameter', async () => {
    const visibility = 'public';
    const mockProjects = [
      { id: 1, title: 'Project 1', visibility },
      { id: 2, title: 'Project 2', visibility }
    ];
    Project.findAll.mockResolvedValue(mockProjects);

    const result = await repository.getByVisibility(visibility);
    
    expect(Project.findAll).toHaveBeenCalledWith({
      where: { visibility },
      include: ['ProjectStatus']
    });
    expect(result).toEqual(mockProjects);
  });

  test('getByVisibility should accept additional options', async () => {
    const visibility = 'public';
    const options = { limit: 5, offset: 10 };
    const mockProjects = [{ id: 1, title: 'Project 1', visibility }];
    Project.findAll.mockResolvedValue(mockProjects);

    const result = await repository.getByVisibility(visibility, options);
    
    expect(Project.findAll).toHaveBeenCalledWith({
      where: { visibility },
      include: ['ProjectStatus'],
      limit: 5,
      offset: 10
    });
    expect(result).toEqual(mockProjects);
  });

  test('getByCustomField should use sequelize literal for JSON field query', async () => {
    const fieldName = 'client';
    const fieldValue = 'Acme Inc';
    const mockProjects = [{ id: 1, title: 'Project 1' }];
    
    Project.findAll.mockResolvedValue(mockProjects);
    sequelize.literal.mockReturnValue(`custom_fields ->> '${fieldName}' = '${fieldValue}'`);

    const result = await repository.getByCustomField(fieldName, fieldValue);
    
    expect(sequelize.literal).toHaveBeenCalledWith(`custom_fields ->> '${fieldName}' = '${fieldValue}'`);
    expect(Project.findAll).toHaveBeenCalledWith({
      where: `custom_fields ->> '${fieldName}' = '${fieldValue}'`
    });
    expect(result).toEqual(mockProjects);
  });
}); 