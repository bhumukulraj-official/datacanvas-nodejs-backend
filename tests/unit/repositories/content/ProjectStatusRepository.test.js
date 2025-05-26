const { ProjectStatusRepository } = require('../../../../src/data/repositories/content');
const { ProjectStatus } = require('../../../../src/data/models');

// Mock the models
jest.mock('../../../../src/data/models', () => ({
  ProjectStatus: {
    findOne: jest.fn(),
    findAll: jest.fn()
  }
}));

// Mock the BaseRepository
jest.mock('../../../../src/data/repositories/BaseRepository', () => {
  return class MockBaseRepository {
    constructor(model) {
      this.model = model;
    }
  };
});

describe('ProjectStatusRepository', () => {
  let repository;
  
  beforeEach(() => {
    repository = new ProjectStatusRepository();
    jest.clearAllMocks();
  });

  test('findByCode should call findOne with correct parameters', async () => {
    const code = 'in-progress';
    const mockStatus = { id: 1, code, name: 'In Progress' };
    ProjectStatus.findOne.mockResolvedValue(mockStatus);
    
    const result = await repository.findByCode(code);
    
    expect(ProjectStatus.findOne).toHaveBeenCalledWith({ where: { code } });
    expect(result).toEqual(mockStatus);
  });

  test('getActiveStatuses should call findAll with correct parameters', async () => {
    const mockStatuses = [
      { id: 1, code: 'pending', name: 'Pending', is_active: true },
      { id: 2, code: 'in-progress', name: 'In Progress', is_active: true },
      { id: 3, code: 'completed', name: 'Completed', is_active: true }
    ];
    ProjectStatus.findAll.mockResolvedValue(mockStatuses);
    
    const result = await repository.getActiveStatuses();
    
    expect(ProjectStatus.findAll).toHaveBeenCalledWith({ where: { is_active: true } });
    expect(result).toEqual(mockStatuses);
  });
}); 