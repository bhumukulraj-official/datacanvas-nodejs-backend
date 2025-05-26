const projectController = require('../../../../src/api/controllers/content/project.controller');
const { ProjectService } = require('../../../../src/services/content');

// Mock the ProjectService
jest.mock('../../../../src/services/content/project.service', () => ({
  createProject: jest.fn(),
  getProjectById: jest.fn(),
  updateProject: jest.fn(),
  getFeaturedProjects: jest.fn(),
  getAllProjects: jest.fn(),
  createProjectUpdate: jest.fn(),
  getProjectUpdates: jest.fn(),
  getProjectUpdateById: jest.fn(),
  updateProjectUpdate: jest.fn(),
  deleteProjectUpdate: jest.fn()
}));

describe('ProjectController', () => {
  let mockReq;
  let mockRes;
  let mockNext;
  
  beforeEach(() => {
    // Mock request, response, and next
    mockReq = {
      user: { id: 'user-123' },
      params: {
        id: 'project-123',
        projectId: 'project-123',
        updateId: 'update-123'
      },
      body: {
        title: 'Test Project',
        description: 'This is a test project',
        repo_url: 'https://github.com/johndoe/test-project',
        live_url: 'https://test-project.com',
        content: 'Detailed content for the project update'
      }
    };
    
    mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('createProject', () => {
    test('should create a project successfully', async () => {
      const mockProject = {
        id: 'project-123',
        title: 'Test Project',
        description: 'This is a test project',
        repo_url: 'https://github.com/johndoe/test-project',
        live_url: 'https://test-project.com',
        owner_id: 'user-123'
      };
      
      // Mock the createProject service method
      ProjectService.createProject.mockResolvedValue(mockProject);
      
      await projectController.createProject(mockReq, mockRes, mockNext);
      
      expect(ProjectService.createProject).toHaveBeenCalledWith({
        ...mockReq.body,
        owner_id: mockReq.user.id
      });
      
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockProject
      });
    });
    
    test('should call next with error on failure', async () => {
      const mockError = new Error('Failed to create project');
      
      // Mock the createProject service method to throw an error
      ProjectService.createProject.mockRejectedValue(mockError);
      
      await projectController.createProject(mockReq, mockRes, mockNext);
      
      expect(ProjectService.createProject).toHaveBeenCalledWith({
        ...mockReq.body,
        owner_id: mockReq.user.id
      });
      
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('getProject', () => {
    test('should get a project successfully', async () => {
      const mockProject = {
        id: 'project-123',
        title: 'Test Project',
        description: 'This is a test project',
        repo_url: 'https://github.com/johndoe/test-project',
        live_url: 'https://test-project.com',
        owner_id: 'user-123'
      };
      
      // Mock the getProjectById service method
      ProjectService.getProjectById.mockResolvedValue(mockProject);
      
      await projectController.getProject(mockReq, mockRes, mockNext);
      
      expect(ProjectService.getProjectById).toHaveBeenCalledWith(
        mockReq.params.id
      );
      
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockProject
      });
    });
    
    test('should call next with error on failure', async () => {
      const mockError = new Error('Failed to get project');
      
      // Mock the getProjectById service method to throw an error
      ProjectService.getProjectById.mockRejectedValue(mockError);
      
      await projectController.getProject(mockReq, mockRes, mockNext);
      
      expect(ProjectService.getProjectById).toHaveBeenCalledWith(
        mockReq.params.id
      );
      
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('updateProject', () => {
    test('should update a project successfully', async () => {
      const mockProject = {
        id: 'project-123',
        title: 'Updated Project',
        description: 'This is an updated test project',
        repo_url: 'https://github.com/johndoe/updated-project',
        live_url: 'https://updated-project.com',
        owner_id: 'user-123'
      };
      
      // Mock the updateProject service method
      ProjectService.updateProject.mockResolvedValue(mockProject);
      
      await projectController.updateProject(mockReq, mockRes, mockNext);
      
      expect(ProjectService.updateProject).toHaveBeenCalledWith(
        mockReq.params.id,
        mockReq.body
      );
      
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockProject
      });
    });
    
    test('should call next with error on failure', async () => {
      const mockError = new Error('Failed to update project');
      
      // Mock the updateProject service method to throw an error
      ProjectService.updateProject.mockRejectedValue(mockError);
      
      await projectController.updateProject(mockReq, mockRes, mockNext);
      
      expect(ProjectService.updateProject).toHaveBeenCalledWith(
        mockReq.params.id,
        mockReq.body
      );
      
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('getFeaturedProjects', () => {
    test('should get featured projects successfully', async () => {
      const mockProjects = [
        { id: 'project-1', title: 'Featured Project 1', featured: true },
        { id: 'project-2', title: 'Featured Project 2', featured: true }
      ];
      
      // Mock the getFeaturedProjects service method
      ProjectService.getFeaturedProjects.mockResolvedValue(mockProjects);
      
      await projectController.getFeaturedProjects(mockReq, mockRes, mockNext);
      
      expect(ProjectService.getFeaturedProjects).toHaveBeenCalled();
      
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockProjects
      });
    });
    
    test('should call next with error on failure', async () => {
      const mockError = new Error('Failed to get featured projects');
      
      // Mock the getFeaturedProjects service method to throw an error
      ProjectService.getFeaturedProjects.mockRejectedValue(mockError);
      
      await projectController.getFeaturedProjects(mockReq, mockRes, mockNext);
      
      expect(ProjectService.getFeaturedProjects).toHaveBeenCalled();
      
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('getAllProjects', () => {
    test('should get all projects successfully', async () => {
      const mockProjects = [
        { id: 'project-1', title: 'Project 1' },
        { id: 'project-2', title: 'Project 2' }
      ];
      
      // Mock the getAllProjects service method
      ProjectService.getAllProjects.mockResolvedValue(mockProjects);
      
      await projectController.getAllProjects(mockReq, mockRes, mockNext);
      
      expect(ProjectService.getAllProjects).toHaveBeenCalled();
      
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockProjects
      });
    });
    
    test('should call next with error on failure', async () => {
      const mockError = new Error('Failed to get all projects');
      
      // Mock the getAllProjects service method to throw an error
      ProjectService.getAllProjects.mockRejectedValue(mockError);
      
      await projectController.getAllProjects(mockReq, mockRes, mockNext);
      
      expect(ProjectService.getAllProjects).toHaveBeenCalled();
      
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('createProjectUpdate', () => {
    test('should create a project update successfully', async () => {
      const mockUpdate = {
        id: 'update-123',
        project_id: 'project-123',
        author_id: 'user-123',
        content: 'Detailed content for the project update',
        created_at: '2023-01-01T00:00:00.000Z'
      };
      
      // Mock the createProjectUpdate service method
      ProjectService.createProjectUpdate.mockResolvedValue(mockUpdate);
      
      await projectController.createProjectUpdate(mockReq, mockRes, mockNext);
      
      expect(ProjectService.createProjectUpdate).toHaveBeenCalledWith(
        mockReq.params.projectId,
        {
          ...mockReq.body,
          author_id: mockReq.user.id
        }
      );
      
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdate
      });
    });
    
    test('should call next with error on failure', async () => {
      const mockError = new Error('Failed to create project update');
      
      // Mock the createProjectUpdate service method to throw an error
      ProjectService.createProjectUpdate.mockRejectedValue(mockError);
      
      await projectController.createProjectUpdate(mockReq, mockRes, mockNext);
      
      expect(ProjectService.createProjectUpdate).toHaveBeenCalledWith(
        mockReq.params.projectId,
        {
          ...mockReq.body,
          author_id: mockReq.user.id
        }
      );
      
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('getProjectUpdates', () => {
    test('should get project updates successfully', async () => {
      const mockUpdates = [
        { id: 'update-1', project_id: 'project-123', author_id: 'user-123' },
        { id: 'update-2', project_id: 'project-123', author_id: 'user-123' }
      ];
      
      // Mock the getProjectUpdates service method
      ProjectService.getProjectUpdates.mockResolvedValue(mockUpdates);
      
      await projectController.getProjectUpdates(mockReq, mockRes, mockNext);
      
      expect(ProjectService.getProjectUpdates).toHaveBeenCalledWith(
        mockReq.params.projectId
      );
      
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdates
      });
    });
    
    test('should call next with error on failure', async () => {
      const mockError = new Error('Failed to get project updates');
      
      // Mock the getProjectUpdates service method to throw an error
      ProjectService.getProjectUpdates.mockRejectedValue(mockError);
      
      await projectController.getProjectUpdates(mockReq, mockRes, mockNext);
      
      expect(ProjectService.getProjectUpdates).toHaveBeenCalledWith(
        mockReq.params.projectId
      );
      
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('getProjectUpdate', () => {
    test('should get a project update successfully', async () => {
      const mockUpdate = {
        id: 'update-123',
        project_id: 'project-123',
        author_id: 'user-123',
        content: 'Detailed content for the project update',
        created_at: '2023-01-01T00:00:00.000Z'
      };
      
      // Mock the getProjectUpdateById service method
      ProjectService.getProjectUpdateById.mockResolvedValue(mockUpdate);
      
      await projectController.getProjectUpdate(mockReq, mockRes, mockNext);
      
      expect(ProjectService.getProjectUpdateById).toHaveBeenCalledWith(
        mockReq.params.projectId,
        mockReq.params.updateId
      );
      
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdate
      });
    });
    
    test('should call next with error on failure', async () => {
      const mockError = new Error('Failed to get project update');
      
      // Mock the getProjectUpdateById service method to throw an error
      ProjectService.getProjectUpdateById.mockRejectedValue(mockError);
      
      await projectController.getProjectUpdate(mockReq, mockRes, mockNext);
      
      expect(ProjectService.getProjectUpdateById).toHaveBeenCalledWith(
        mockReq.params.projectId,
        mockReq.params.updateId
      );
      
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('updateProjectUpdate', () => {
    test('should update a project update successfully', async () => {
      const mockUpdate = {
        id: 'update-123',
        project_id: 'project-123',
        author_id: 'user-123',
        content: 'Updated content for the project update',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-02T00:00:00.000Z'
      };
      
      // Mock the updateProjectUpdate service method
      ProjectService.updateProjectUpdate.mockResolvedValue(mockUpdate);
      
      await projectController.updateProjectUpdate(mockReq, mockRes, mockNext);
      
      expect(ProjectService.updateProjectUpdate).toHaveBeenCalledWith(
        mockReq.params.projectId,
        mockReq.params.updateId,
        mockReq.body
      );
      
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdate
      });
    });
    
    test('should call next with error on failure', async () => {
      const mockError = new Error('Failed to update project update');
      
      // Mock the updateProjectUpdate service method to throw an error
      ProjectService.updateProjectUpdate.mockRejectedValue(mockError);
      
      await projectController.updateProjectUpdate(mockReq, mockRes, mockNext);
      
      expect(ProjectService.updateProjectUpdate).toHaveBeenCalledWith(
        mockReq.params.projectId,
        mockReq.params.updateId,
        mockReq.body
      );
      
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('deleteProjectUpdate', () => {
    test('should delete a project update successfully', async () => {
      // Mock the deleteProjectUpdate service method
      ProjectService.deleteProjectUpdate.mockResolvedValue();
      
      await projectController.deleteProjectUpdate(mockReq, mockRes, mockNext);
      
      expect(ProjectService.deleteProjectUpdate).toHaveBeenCalledWith(
        mockReq.params.projectId,
        mockReq.params.updateId
      );
      
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Project update deleted successfully'
      });
    });
    
    test('should call next with error on failure', async () => {
      const mockError = new Error('Failed to delete project update');
      
      // Mock the deleteProjectUpdate service method to throw an error
      ProjectService.deleteProjectUpdate.mockRejectedValue(mockError);
      
      await projectController.deleteProjectUpdate(mockReq, mockRes, mockNext);
      
      expect(ProjectService.deleteProjectUpdate).toHaveBeenCalledWith(
        mockReq.params.projectId,
        mockReq.params.updateId
      );
      
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });
});