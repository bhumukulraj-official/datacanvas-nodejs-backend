const { ProjectVisibilityRepository } = require('../../../../src/data/repositories/content');
const { ProjectVisibility, Project } = require('../../../../src/data/models');

// Mock the models
jest.mock('../../../../src/data/models', () => ({
  ProjectVisibility: {
    findOne: jest.fn()
  },
  Project: {}
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

describe('ProjectVisibilityRepository', () => {
  let repository;
  
  beforeEach(() => {
    repository = new ProjectVisibilityRepository();
    jest.clearAllMocks();
  });

  test('getByProjectId should call findOne with correct parameters', async () => {
    const projectId = 5;
    const mockVisibility = { id: 1, project_id: projectId, visibility_level: 'public' };
    
    ProjectVisibility.findOne.mockResolvedValue(mockVisibility);
    
    const result = await repository.getByProjectId(projectId);
    
    expect(ProjectVisibility.findOne).toHaveBeenCalledWith({
      where: { project_id: projectId }
    });
    expect(result).toEqual(mockVisibility);
  });

  test('setVisibilityLevel should update existing record when found', async () => {
    const projectId = 5;
    const visibilityLevel = 'private';
    const mockVisibility = { id: 1, project_id: projectId, visibility_level: 'public' };
    const updatedVisibility = { id: 1, project_id: projectId, visibility_level: visibilityLevel };
    
    // Mock getByProjectId to return existing record
    repository.getByProjectId = jest.fn().mockResolvedValue(mockVisibility);
    
    // Mock update method
    repository.update = jest.fn().mockResolvedValue(updatedVisibility);
    
    const result = await repository.setVisibilityLevel(projectId, visibilityLevel);
    
    expect(repository.getByProjectId).toHaveBeenCalledWith(projectId);
    expect(repository.update).toHaveBeenCalledWith(1, { visibility_level: visibilityLevel });
    expect(result).toEqual(updatedVisibility);
  });

  test('setVisibilityLevel should create new record when not found', async () => {
    const projectId = 5;
    const visibilityLevel = 'private';
    const newVisibility = { id: 1, project_id: projectId, visibility_level: visibilityLevel };
    
    // Mock getByProjectId to return null (record not found)
    repository.getByProjectId = jest.fn().mockResolvedValue(null);
    
    // Mock create method
    repository.create = jest.fn().mockResolvedValue(newVisibility);
    
    const result = await repository.setVisibilityLevel(projectId, visibilityLevel);
    
    expect(repository.getByProjectId).toHaveBeenCalledWith(projectId);
    expect(repository.create).toHaveBeenCalledWith({
      project_id: projectId,
      visibility_level: visibilityLevel
    });
    expect(result).toEqual(newVisibility);
  });

  test('updateClientExceptions should update existing record when found', async () => {
    const projectId = 5;
    const clientExceptions = { '1': 'view', '2': 'edit' };
    const mockVisibility = { id: 1, project_id: projectId };
    const updatedVisibility = { id: 1, project_id: projectId, client_exceptions: clientExceptions };
    
    // Mock getByProjectId to return existing record
    repository.getByProjectId = jest.fn().mockResolvedValue(mockVisibility);
    
    // Mock update method
    repository.update = jest.fn().mockResolvedValue(updatedVisibility);
    
    const result = await repository.updateClientExceptions(projectId, clientExceptions);
    
    expect(repository.getByProjectId).toHaveBeenCalledWith(projectId);
    expect(repository.update).toHaveBeenCalledWith(1, { client_exceptions: clientExceptions });
    expect(result).toEqual(updatedVisibility);
  });

  test('updateClientExceptions should return null when record not found', async () => {
    const projectId = 5;
    const clientExceptions = { '1': 'view', '2': 'edit' };
    
    // Mock getByProjectId to return null (record not found)
    repository.getByProjectId = jest.fn().mockResolvedValue(null);
    
    const result = await repository.updateClientExceptions(projectId, clientExceptions);
    
    expect(repository.getByProjectId).toHaveBeenCalledWith(projectId);
    expect(result).toBeNull();
  });

  test('addClientException should add client to exceptions', async () => {
    const projectId = 5;
    const clientId = 10;
    const accessType = 'view';
    const mockVisibility = { 
      id: 1, 
      project_id: projectId, 
      client_exceptions: { '2': 'edit' } 
    };
    const updatedExceptions = { '2': 'edit', '10': 'view' };
    const updatedVisibility = { 
      id: 1, 
      project_id: projectId, 
      client_exceptions: updatedExceptions 
    };
    
    // Mock getByProjectId to return existing record
    repository.getByProjectId = jest.fn().mockResolvedValue(mockVisibility);
    
    // Mock update method
    repository.update = jest.fn().mockResolvedValue(updatedVisibility);
    
    const result = await repository.addClientException(projectId, clientId, accessType);
    
    expect(repository.getByProjectId).toHaveBeenCalledWith(projectId);
    expect(repository.update).toHaveBeenCalledWith(1, { client_exceptions: updatedExceptions });
    expect(result).toEqual(updatedVisibility);
  });

  test('addClientException should return null when record not found', async () => {
    const projectId = 5;
    const clientId = 10;
    const accessType = 'view';
    
    // Mock getByProjectId to return null (record not found)
    repository.getByProjectId = jest.fn().mockResolvedValue(null);
    
    const result = await repository.addClientException(projectId, clientId, accessType);
    
    expect(repository.getByProjectId).toHaveBeenCalledWith(projectId);
    expect(result).toBeNull();
  });

  test('removeClientException should remove client from exceptions', async () => {
    const projectId = 5;
    const clientId = '10';
    const mockVisibility = { 
      id: 1, 
      project_id: projectId, 
      client_exceptions: { '2': 'edit', '10': 'view' } 
    };
    const updatedExceptions = { '2': 'edit' };
    const updatedVisibility = { 
      id: 1, 
      project_id: projectId, 
      client_exceptions: updatedExceptions 
    };
    
    // Mock getByProjectId to return existing record
    repository.getByProjectId = jest.fn().mockResolvedValue(mockVisibility);
    
    // Mock update method
    repository.update = jest.fn().mockResolvedValue(updatedVisibility);
    
    const result = await repository.removeClientException(projectId, clientId);
    
    expect(repository.getByProjectId).toHaveBeenCalledWith(projectId);
    expect(repository.update).toHaveBeenCalledWith(1, { client_exceptions: updatedExceptions });
    expect(result).toEqual(updatedVisibility);
  });

  test('removeClientException should return null when record not found', async () => {
    const projectId = 5;
    const clientId = '10';
    
    // Mock getByProjectId to return null (record not found)
    repository.getByProjectId = jest.fn().mockResolvedValue(null);
    
    const result = await repository.removeClientException(projectId, clientId);
    
    expect(repository.getByProjectId).toHaveBeenCalledWith(projectId);
    expect(result).toBeNull();
  });

  test('removeClientException should return null when client_exceptions not present', async () => {
    const projectId = 5;
    const clientId = '10';
    const mockVisibility = { 
      id: 1, 
      project_id: projectId 
      // No client_exceptions property
    };
    
    // Mock getByProjectId to return record without client_exceptions
    repository.getByProjectId = jest.fn().mockResolvedValue(mockVisibility);
    
    const result = await repository.removeClientException(projectId, clientId);
    
    expect(repository.getByProjectId).toHaveBeenCalledWith(projectId);
    expect(result).toBeNull();
  });
}); 