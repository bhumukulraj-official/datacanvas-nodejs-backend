const projectService = require('../../../../../src/modules/projects/services/project.service');
const { NotFoundError } = require('../../../../../src/shared/errors');
const cache = require('../../../../../src/shared/utils/cache');

// Mock the Project model
jest.mock('../../../../../src/modules/projects/models/Project', () => ({
  findAll: jest.fn(),
  findOne: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
  count: jest.fn()
}));

// Mock the cache utility
jest.mock('../../../../../src/shared/utils/cache', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  delByPattern: jest.fn(),
  cacheWrapper: jest.fn().mockImplementation((fn) => fn),
  clearEntityCache: jest.fn()
}));

describe('Project Service', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllProjects', () => {
    test('should return paginated list of projects', async () => {
      // Mock data
      const mockProjects = [
        { id: '1', title: 'Project 1', description: 'Description 1' },
        { id: '2', title: 'Project 2', description: 'Description 2' }
      ];
      
      const Project = require('../../../../../src/modules/projects/models/Project');
      
      // Mock Project.findAll to return projects
      Project.findAll.mockResolvedValueOnce(mockProjects);
      
      // Mock Project.count to return total
      Project.count.mockResolvedValueOnce(2);
      
      // Execute the service method
      const result = await projectService.getAllProjects({ page: 1, limit: 10 });
      
      // Verify results
      expect(Project.findAll).toHaveBeenCalled();
      expect(Project.count).toHaveBeenCalled();
      expect(result).toHaveProperty('projects');
      expect(result).toHaveProperty('pagination');
      expect(result.projects).toHaveLength(2);
      expect(result.pagination.totalItems).toBe(2);
    });

    test('should apply filters when provided', async () => {
      // Mock data
      const mockProjects = [
        { id: '1', title: 'Project 1', description: 'Description 1', tags: ['react'] }
      ];
      
      const Project = require('../../../../../src/modules/projects/models/Project');
      
      // Mock Project.findAll to return filtered projects
      Project.findAll.mockResolvedValueOnce(mockProjects);
      
      // Mock Project.count to return filtered total
      Project.count.mockResolvedValueOnce(1);
      
      // Execute the service method with filters
      const result = await projectService.getAllProjects({ 
        page: 1, 
        limit: 10,
        tags: ['react']
      });
      
      // Verify filters were applied
      expect(Project.findAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.anything()
      }));
      expect(result.projects).toHaveLength(1);
      expect(result.pagination.totalItems).toBe(1);
    });
  });

  describe('getProjectById', () => {
    test('should return a project by ID', async () => {
      // Mock data
      const mockProject = { 
        id: '1', 
        title: 'Project 1', 
        description: 'Description 1',
        userId: 'user_1'
      };
      
      const Project = require('../../../../../src/modules/projects/models/Project');
      
      // Mock Project.findByPk to return a project
      Project.findByPk.mockResolvedValueOnce(mockProject);
      
      // Execute the service method
      const result = await projectService.getProjectById('1');
      
      // Verify results
      expect(Project.findByPk).toHaveBeenCalledWith('1', expect.anything());
      expect(result).toEqual(mockProject);
    });

    test('should throw NotFoundError for non-existent project', async () => {
      const Project = require('../../../../../src/modules/projects/models/Project');
      
      // Mock Project.findByPk to return null (project not found)
      Project.findByPk.mockResolvedValueOnce(null);
      
      // Execute and expect error
      await expect(projectService.getProjectById('nonexistent'))
        .rejects.toThrow(NotFoundError);
      
      expect(Project.findByPk).toHaveBeenCalledWith('nonexistent', expect.anything());
    });
  });

  describe('createProject', () => {
    test('should create a new project', async () => {
      // Mock data
      const projectData = {
        title: 'New Project',
        description: 'Project Description',
        tags: ['javascript', 'react'],
        userId: 'user_1'
      };
      
      const createdProject = {
        id: '1',
        ...projectData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const Project = require('../../../../../src/modules/projects/models/Project');
      
      // Mock Project.create to return the created project
      Project.create.mockResolvedValueOnce(createdProject);
      
      // Execute the service method
      const result = await projectService.createProject(projectData);
      
      // Verify results
      expect(Project.create).toHaveBeenCalledWith(projectData);
      expect(result).toEqual(createdProject);
      expect(cache.clearEntityCache).toHaveBeenCalledWith('projects');
    });
  });

  describe('updateProject', () => {
    test('should update an existing project', async () => {
      // Mock data
      const projectId = '1';
      const updateData = {
        title: 'Updated Project',
        description: 'Updated Description'
      };
      
      const existingProject = {
        id: projectId,
        title: 'Original Title',
        description: 'Original Description',
        userId: 'user_1',
        save: jest.fn().mockResolvedValueOnce({ id: projectId, ...updateData, userId: 'user_1' })
      };
      
      const Project = require('../../../../../src/modules/projects/models/Project');
      
      // Mock Project.findByPk to return the existing project
      Project.findByPk.mockResolvedValueOnce(existingProject);
      
      // Execute the service method
      const result = await projectService.updateProject(projectId, updateData);
      
      // Verify results
      expect(Project.findByPk).toHaveBeenCalledWith(projectId);
      expect(existingProject.save).toHaveBeenCalled();
      expect(result).toHaveProperty('title', updateData.title);
      expect(cache.clearEntityCache).toHaveBeenCalledWith('projects', projectId);
    });

    test('should throw NotFoundError for non-existent project', async () => {
      const Project = require('../../../../../src/modules/projects/models/Project');
      
      // Mock Project.findByPk to return null (project not found)
      Project.findByPk.mockResolvedValueOnce(null);
      
      // Execute and expect error
      await expect(projectService.updateProject('nonexistent', { title: 'New Title' }))
        .rejects.toThrow(NotFoundError);
      
      expect(Project.findByPk).toHaveBeenCalledWith('nonexistent');
    });
  });

  describe('deleteProject', () => {
    test('should delete an existing project', async () => {
      // Mock data
      const projectId = '1';
      const existingProject = {
        id: projectId,
        title: 'Project to Delete',
        destroy: jest.fn().mockResolvedValueOnce(undefined)
      };
      
      const Project = require('../../../../../src/modules/projects/models/Project');
      
      // Mock Project.findByPk to return the existing project
      Project.findByPk.mockResolvedValueOnce(existingProject);
      
      // Execute the service method
      await projectService.deleteProject(projectId);
      
      // Verify results
      expect(Project.findByPk).toHaveBeenCalledWith(projectId);
      expect(existingProject.destroy).toHaveBeenCalled();
      expect(cache.clearEntityCache).toHaveBeenCalledWith('projects', projectId);
    });

    test('should throw NotFoundError for non-existent project', async () => {
      const Project = require('../../../../../src/modules/projects/models/Project');
      
      // Mock Project.findByPk to return null (project not found)
      Project.findByPk.mockResolvedValueOnce(null);
      
      // Execute and expect error
      await expect(projectService.deleteProject('nonexistent'))
        .rejects.toThrow(NotFoundError);
      
      expect(Project.findByPk).toHaveBeenCalledWith('nonexistent');
    });
  });
}); 