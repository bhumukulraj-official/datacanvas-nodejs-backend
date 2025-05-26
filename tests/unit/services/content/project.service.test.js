const projectService = require('../../../../src/services/content/project.service');
const { ProjectRepository, ProjectStatusRepository, ProjectUpdateRepository, TagRepository } = require('../../../../src/data/repositories/content');
const { ResourceNotFoundError, CustomError } = require('../../../../src/utils/error.util');
const logger = require('../../../../src/utils/logger.util');

// Mock the repositories
jest.mock('../../../../src/data/repositories/content', () => ({
  ProjectRepository: jest.fn(),
  ProjectStatusRepository: jest.fn(),
  ProjectUpdateRepository: jest.fn(),
  TagRepository: jest.fn()
}));

// Mock logger
jest.mock('../../../../src/utils/logger.util', () => ({
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}));

describe('ProjectService', () => {
  let mockProjectRepository;
  let mockStatusRepository;
  let mockTagRepository;
  let mockProjectUpdateRepository;
  
  beforeEach(() => {
    // Create new instances of mocked repositories
    mockProjectRepository = new ProjectRepository();
    mockStatusRepository = new ProjectStatusRepository();
    mockTagRepository = new TagRepository();
    mockProjectUpdateRepository = new ProjectUpdateRepository();
    
    // Reset mock implementations
    jest.clearAllMocks();
    
    // Mock repositories on the service
    projectService.projectRepo = mockProjectRepository;
    projectService.statusRepo = mockStatusRepository;
    projectService.tagRepo = mockTagRepository;
    projectService.projectUpdateRepo = mockProjectUpdateRepository;
  });

  describe('createProject', () => {
    test('should create a new project successfully', async () => {
      // Mock status repository
      const mockStatus = {
        id: 1,
        code: 'draft',
        name: 'Draft'
      };
      
      mockStatusRepository.findByCode = jest.fn().mockResolvedValue(mockStatus);
      
      // Mock project creation
      const mockProject = {
        id: 1,
        title: 'Test Project',
        description: 'Test description',
        project_status_id: 1,
        created_at: new Date()
      };
      
      mockProjectRepository.create = jest.fn().mockResolvedValue(mockProject);
      
      // Call the service method
      const projectData = {
        title: 'Test Project',
        description: 'Test description'
      };
      
      const result = await projectService.createProject(projectData);
      
      // Assertions
      expect(mockStatusRepository.findByCode).toHaveBeenCalledWith('draft');
      expect(mockProjectRepository.create).toHaveBeenCalledWith({
        ...projectData,
        project_status_id: 1
      });
      expect(result).toEqual(mockProject);
    });
  });

  describe('getProjectById', () => {
    test('should return a project by ID', async () => {
      // Mock project
      const mockProject = {
        id: 1,
        title: 'Test Project',
        description: 'Test description',
        project_status_id: 1,
        created_at: new Date()
      };
      
      mockProjectRepository.findById = jest.fn().mockResolvedValue(mockProject);
      
      // Mock _enrichProject
      const mockEnrichedProject = {
        ...mockProject,
        status: {
          id: 1,
          code: 'draft',
          name: 'Draft'
        }
      };
      
      const enrichProjectSpy = jest.spyOn(projectService, '_enrichProject')
        .mockResolvedValue(mockEnrichedProject);
      
      // Call the service method
      const result = await projectService.getProjectById(1);
      
      // Assertions
      expect(mockProjectRepository.findById).toHaveBeenCalledWith(1);
      expect(enrichProjectSpy).toHaveBeenCalledWith(mockProject);
      expect(result).toEqual(mockEnrichedProject);
      
      // Restore the spy
      enrichProjectSpy.mockRestore();
    });
    
    test('should throw error if project not found', async () => {
      mockProjectRepository.findById = jest.fn().mockResolvedValue(null);
      
      // Call the service method and expect it to throw
      await expect(
        projectService.getProjectById(999)
      ).rejects.toThrow(ResourceNotFoundError);
      
      // Assertions
      expect(mockProjectRepository.findById).toHaveBeenCalledWith(999);
    });
  });

  describe('updateProject', () => {
    test('should update a project successfully', async () => {
      // Mock update
      mockProjectRepository.update = jest.fn().mockResolvedValue([1]);
      
      // Mock getProjectById
      const mockUpdatedProject = {
        id: 1,
        title: 'Updated Project',
        description: 'Updated description',
        project_status_id: 1,
        status: {
          id: 1,
          code: 'draft',
          name: 'Draft'
        }
      };
      
      const getProjectByIdSpy = jest.spyOn(projectService, 'getProjectById')
        .mockResolvedValue(mockUpdatedProject);
      
      // Call the service method
      const updateData = {
        title: 'Updated Project',
        description: 'Updated description'
      };
      
      const result = await projectService.updateProject(1, updateData);
      
      // Assertions
      expect(mockProjectRepository.update).toHaveBeenCalledWith(1, updateData);
      expect(getProjectByIdSpy).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUpdatedProject);
      
      // Restore the spy
      getProjectByIdSpy.mockRestore();
    });
    
    test('should throw error if project not found', async () => {
      // Mock update to return 0 affected rows
      mockProjectRepository.update = jest.fn().mockResolvedValue([0]);
      
      // Call the service method and expect it to throw
      await expect(
        projectService.updateProject(999, { title: 'New Title' })
      ).rejects.toThrow(ResourceNotFoundError);
      
      // Assertions
      expect(mockProjectRepository.update).toHaveBeenCalledWith(999, { title: 'New Title' });
    });
  });

  describe('getFeaturedProjects', () => {
    test('should return featured projects', async () => {
      // Mock featured projects
      const mockProjects = [
        {
          id: 1,
          title: 'Featured Project 1',
          description: 'Description 1',
          is_featured: true,
          project_status_id: 2
        },
        {
          id: 2,
          title: 'Featured Project 2',
          description: 'Description 2',
          is_featured: true,
          project_status_id: 2
        }
      ];
      
      mockProjectRepository.getFeaturedProjects = jest.fn().mockResolvedValue(mockProjects);
      
      // Mock _enrichProject
      const mockEnrichedProjects = mockProjects.map(p => ({
        ...p,
        status: {
          id: 2,
          code: 'published',
          name: 'Published'
        }
      }));
      
      const enrichProjectSpy = jest.spyOn(projectService, '_enrichProject')
        .mockImplementation(project => Promise.resolve({
          ...project,
          status: {
            id: 2,
            code: 'published',
            name: 'Published'
          }
        }));
      
      // Call the service method
      const result = await projectService.getFeaturedProjects();
      
      // Assertions
      expect(mockProjectRepository.getFeaturedProjects).toHaveBeenCalled();
      expect(enrichProjectSpy).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockEnrichedProjects);
      
      // Restore the spy
      enrichProjectSpy.mockRestore();
    });
    
    test('should return empty array if no featured projects', async () => {
      mockProjectRepository.getFeaturedProjects = jest.fn().mockResolvedValue([]);
      
      // Call the service method
      const result = await projectService.getFeaturedProjects();
      
      // Assertions
      expect(mockProjectRepository.getFeaturedProjects).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
    
    test('should return empty array if error occurs', async () => {
      mockProjectRepository.getFeaturedProjects = jest.fn().mockRejectedValue(new Error('DB error'));
      
      // Call the service method
      const result = await projectService.getFeaturedProjects();
      
      // Assertions
      expect(mockProjectRepository.getFeaturedProjects).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('changeProjectStatus', () => {
    test('should change project status successfully', async () => {
      // Mock status
      const mockStatus = {
        id: 2,
        code: 'published',
        name: 'Published'
      };
      
      mockStatusRepository.findByCode = jest.fn().mockResolvedValue(mockStatus);
      
      // Mock update
      const mockUpdateResult = [1];
      mockProjectRepository.update = jest.fn().mockResolvedValue(mockUpdateResult);
      
      // Call the service method
      const result = await projectService.changeProjectStatus(1, 'published');
      
      // Assertions
      expect(mockStatusRepository.findByCode).toHaveBeenCalledWith('published');
      expect(mockProjectRepository.update).toHaveBeenCalledWith(1, { project_status_id: 2 });
      expect(result).toEqual(mockUpdateResult);
    });
    
    test('should throw error if status code is invalid', async () => {
      mockStatusRepository.findByCode = jest.fn().mockResolvedValue(null);
      
      // Call the service method and expect it to throw
      await expect(
        projectService.changeProjectStatus(1, 'invalid_status')
      ).rejects.toThrow(CustomError);
      
      // Assertions
      expect(mockStatusRepository.findByCode).toHaveBeenCalledWith('invalid_status');
      expect(mockProjectRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('createProjectUpdate', () => {
    test('should create a project update successfully', async () => {
      // Mock project
      const mockProject = {
        id: 1,
        title: 'Test Project',
        description: 'Test description'
      };
      
      mockProjectRepository.findById = jest.fn().mockResolvedValue(mockProject);
      
      // Mock update creation
      const mockUpdate = {
        id: 1,
        project_id: 1,
        title: 'Project Update',
        content: 'Update content',
        created_at: new Date()
      };
      
      mockProjectUpdateRepository.create = jest.fn().mockResolvedValue(mockUpdate);
      
      // Call the service method
      const updateData = {
        title: 'Project Update',
        content: 'Update content'
      };
      
      const result = await projectService.createProjectUpdate(1, updateData);
      
      // Assertions
      expect(mockProjectRepository.findById).toHaveBeenCalledWith(1);
      expect(mockProjectUpdateRepository.create).toHaveBeenCalledWith({
        ...updateData,
        project_id: 1
      });
      expect(result).toEqual(mockUpdate);
    });
    
    test('should throw error if project not found', async () => {
      mockProjectRepository.findById = jest.fn().mockResolvedValue(null);
      
      // Call the service method and expect it to throw
      await expect(
        projectService.createProjectUpdate(999, { title: 'Update', content: 'Content' })
      ).rejects.toThrow(ResourceNotFoundError);
      
      // Assertions
      expect(mockProjectRepository.findById).toHaveBeenCalledWith(999);
      expect(mockProjectUpdateRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('_enrichProject', () => {
    test('should enrich project with status information', async () => {
      // Mock project
      const mockProject = {
        id: 1,
        title: 'Test Project',
        description: 'Test description',
        project_status_id: 2,
        get: jest.fn().mockReturnValue({
          id: 1,
          title: 'Test Project',
          description: 'Test description',
          project_status_id: 2
        })
      };
      
      // Mock status
      const mockStatus = {
        id: 2,
        code: 'published',
        name: 'Published'
      };
      
      mockStatusRepository.findById = jest.fn().mockResolvedValue(mockStatus);
      
      // Call the service method
      const result = await projectService._enrichProject(mockProject);
      
      // Assertions
      expect(mockStatusRepository.findById).toHaveBeenCalledWith(2);
      expect(mockProject.get).toHaveBeenCalled();
      expect(result).toEqual({
        id: 1,
        title: 'Test Project',
        description: 'Test description',
        project_status_id: 2
      });
    });
  });
}); 