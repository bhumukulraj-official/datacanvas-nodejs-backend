const { ProjectFileRepository } = require('../../../../src/data/repositories/content');
const { ProjectFile } = require('../../../../src/data/models');
const { Op } = require('sequelize');
const { CustomError } = require('../../../../src/utils/error.util');
const logger = require('../../../../src/utils/logger.util');

// Mock the models
jest.mock('../../../../src/data/models', () => ({
  ProjectFile: {
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

// Mock sequelize
jest.mock('sequelize', () => ({
  Op: {
    iLike: Symbol('iLike')
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

describe('ProjectFileRepository', () => {
  let repository;
  
  beforeEach(() => {
    repository = new ProjectFileRepository();
    jest.clearAllMocks();
  });

  test('getLatestVersions should call findAll with correct parameters', async () => {
    const projectId = 5;
    const mockFiles = [
      { id: 1, project_id: projectId, filename: 'file1.txt', version: 2 },
      { id: 2, project_id: projectId, filename: 'file2.txt', version: 1 }
    ];
    ProjectFile.findAll.mockResolvedValue(mockFiles);
    
    const result = await repository.getLatestVersions(projectId);
    
    expect(ProjectFile.findAll).toHaveBeenCalledWith({
      where: { project_id: projectId },
      order: [['version', 'DESC']],
      group: ['filename']
    });
    expect(result).toEqual(mockFiles);
  });

  test('getByFileType should call findAll with correct parameters', async () => {
    const fileType = 'pdf';
    const mockFiles = [
      { id: 1, file_type: 'application/pdf' },
      { id: 2, file_type: 'application/pdf' }
    ];
    ProjectFile.findAll.mockResolvedValue(mockFiles);
    
    const result = await repository.getByFileType(fileType);
    
    expect(ProjectFile.findAll).toHaveBeenCalledWith({
      where: {
        file_type: {
          [Op.iLike]: `%${fileType}%`
        }
      }
    });
    expect(result).toEqual(mockFiles);
  });

  test('getByUploader should call findAll with correct parameters', async () => {
    const userId = 10;
    const mockFiles = [
      { id: 1, uploaded_by: userId },
      { id: 2, uploaded_by: userId }
    ];
    ProjectFile.findAll.mockResolvedValue(mockFiles);
    
    const result = await repository.getByUploader(userId);
    
    expect(ProjectFile.findAll).toHaveBeenCalledWith({
      where: { uploaded_by: userId },
      include: ['project']
    });
    expect(result).toEqual(mockFiles);
  });
}); 