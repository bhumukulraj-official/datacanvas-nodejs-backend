const { ProjectClientAssignmentRepository } = require('../../../../src/data/repositories/content');
const { ProjectClientAssignment } = require('../../../../src/data/models');
const { CustomError } = require('../../../../src/utils/error.util');
const logger = require('../../../../src/utils/logger.util');

// Mock the models
jest.mock('../../../../src/data/models', () => ({
  ProjectClientAssignment: {
    findAll: jest.fn()
  }
}));

// Mock the logger
jest.mock('../../../../src/utils/logger.util', () => ({
  info: jest.fn()
}));

// Mock the error utility
jest.mock('../../../../src/utils/error.util', () => ({
  CustomError: class CustomError extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
    }
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

describe('ProjectClientAssignmentRepository', () => {
  let repository;
  
  beforeEach(() => {
    repository = new ProjectClientAssignmentRepository();
    jest.clearAllMocks();
  });

  test('getActiveAssignments should call findAll with correct parameters', async () => {
    const projectId = 5;
    const mockAssignments = [
      { id: 1, project_id: projectId, is_active: true },
      { id: 2, project_id: projectId, is_active: true }
    ];
    ProjectClientAssignment.findAll.mockResolvedValue(mockAssignments);
    
    const result = await repository.getActiveAssignments(projectId);
    
    expect(ProjectClientAssignment.findAll).toHaveBeenCalledWith({
      where: { project_id: projectId, is_active: true },
      include: ['client']
    });
    expect(result).toEqual(mockAssignments);
  });

  test('getActiveByProject should call findAll with correct parameters', async () => {
    const projectId = 5;
    const mockAssignments = [
      { id: 1, project_id: projectId, is_active: true },
      { id: 2, project_id: projectId, is_active: true }
    ];
    ProjectClientAssignment.findAll.mockResolvedValue(mockAssignments);
    
    const result = await repository.getActiveByProject(projectId);
    
    expect(ProjectClientAssignment.findAll).toHaveBeenCalledWith({
      where: { project_id: projectId, is_active: true },
      include: ['client']
    });
    expect(result).toEqual(mockAssignments);
  });

  test('deactivateAssignment should call update with correct parameters', async () => {
    const assignmentId = 1;
    
    // Mock the update method
    repository.update = jest.fn().mockResolvedValue({ 
      id: assignmentId, 
      is_active: false,
      end_date: expect.any(Date)
    });
    
    // Mock Date for consistent testing
    const now = new Date();
    jest.spyOn(global, 'Date').mockImplementation(() => now);
    
    const result = await repository.deactivateAssignment(assignmentId);
    
    expect(repository.update).toHaveBeenCalledWith(assignmentId, { 
      is_active: false,
      end_date: now
    });
    expect(result).toEqual({ 
      id: assignmentId, 
      is_active: false,
      end_date: now
    });
    
    // Restore Date mock
    global.Date.mockRestore();
  });
}); 