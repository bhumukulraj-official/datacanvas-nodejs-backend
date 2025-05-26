const { ProjectUpdateRepository } = require('../../../../src/data/repositories/content');
const { ProjectUpdate } = require('../../../../src/data/models');

// Mock the models
jest.mock('../../../../src/data/models', () => ({
  ProjectUpdate: {
    findAll: jest.fn()
  }
}));

// Mock the BaseRepository
jest.mock('../../../../src/data/repositories/BaseRepository', () => {
  return class MockBaseRepository {
    constructor(model) {
      this.model = model;
    }
    
    async update(id, data) {
      return { id, ...data };
    }
  };
});

describe('ProjectUpdateRepository', () => {
  let repository;
  
  beforeEach(() => {
    repository = new ProjectUpdateRepository();
    jest.clearAllMocks();
  });

  test('getUpdatesForProject should call findAll with correct parameters', async () => {
    const projectId = 5;
    const options = { order: [['created_at', 'DESC']] };
    const mockUpdates = [
      { id: 1, project_id: projectId, title: 'Update 1' },
      { id: 2, project_id: projectId, title: 'Update 2' }
    ];
    
    ProjectUpdate.findAll.mockResolvedValue(mockUpdates);
    
    const result = await repository.getUpdatesForProject(projectId, options);
    
    expect(ProjectUpdate.findAll).toHaveBeenCalledWith({
      where: { project_id: projectId },
      order: [['created_at', 'DESC']]
    });
    expect(result).toEqual(mockUpdates);
  });

  test('findByProjectId should call findAll with correct parameters', async () => {
    const projectId = 5;
    const mockUpdates = [
      { id: 1, project_id: projectId, title: 'Update 1' },
      { id: 2, project_id: projectId, title: 'Update 2' }
    ];
    
    ProjectUpdate.findAll.mockResolvedValue(mockUpdates);
    
    const result = await repository.findByProjectId(projectId);
    
    expect(ProjectUpdate.findAll).toHaveBeenCalledWith({
      where: { project_id: projectId },
      order: [['created_at', 'DESC']]
    });
    expect(result).toEqual(mockUpdates);
  });

  test('markAsViewed should call update with correct parameters', async () => {
    const updateId = 1;
    
    // Mock the update method
    repository.update = jest.fn().mockResolvedValue({ 
      id: updateId, 
      client_viewed_at: expect.any(Date)
    });
    
    // Mock Date for consistent testing
    const now = new Date();
    jest.spyOn(global, 'Date').mockImplementation(() => now);
    
    const result = await repository.markAsViewed(updateId);
    
    expect(repository.update).toHaveBeenCalledWith(updateId, { client_viewed_at: now });
    expect(result).toEqual({ 
      id: updateId, 
      client_viewed_at: now
    });
    
    // Restore Date mock
    global.Date.mockRestore();
  });

  test('getUnviewedUpdates should call findAll with correct parameters', async () => {
    const projectId = 5;
    const mockUpdates = [
      { id: 1, project_id: projectId, client_viewed_at: null },
      { id: 2, project_id: projectId, client_viewed_at: null }
    ];
    
    ProjectUpdate.findAll.mockResolvedValue(mockUpdates);
    
    const result = await repository.getUnviewedUpdates(projectId);
    
    expect(ProjectUpdate.findAll).toHaveBeenCalledWith({
      where: {
        project_id: projectId,
        client_viewed_at: null
      }
    });
    expect(result).toEqual(mockUpdates);
  });

  test('markAsNotified should call update with correct parameters', async () => {
    const updateId = 1;
    
    // Mock the update method
    repository.update = jest.fn().mockResolvedValue({ 
      id: updateId, 
      notified_at: expect.any(Date)
    });
    
    // Mock Date for consistent testing
    const now = new Date();
    jest.spyOn(global, 'Date').mockImplementation(() => now);
    
    const result = await repository.markAsNotified(updateId);
    
    expect(repository.update).toHaveBeenCalledWith(updateId, {
      notified_at: now
    });
    expect(result).toEqual({ 
      id: updateId, 
      notified_at: now
    });
    
    // Restore Date mock
    global.Date.mockRestore();
  });
}); 