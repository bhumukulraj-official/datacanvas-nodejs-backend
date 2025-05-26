const { ProjectTagRepository } = require('../../../../src/data/repositories/content');
const { ProjectTag, Tag, Project } = require('../../../../src/data/models');

// Mock the models
jest.mock('../../../../src/data/models', () => ({
  ProjectTag: {
    findAll: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn()
  },
  Tag: {},
  Project: {}
}));

// Mock the BaseRepository
jest.mock('../../../../src/data/repositories/BaseRepository', () => {
  return class MockBaseRepository {
    constructor(model) {
      this.model = model;
    }
  };
});

describe('ProjectTagRepository', () => {
  let repository;
  
  beforeEach(() => {
    repository = new ProjectTagRepository();
    jest.clearAllMocks();
  });

  test('getTagsByProjectId should call findAll with correct parameters', async () => {
    const projectId = 5;
    const mockProjectTags = [
      { id: 1, project_id: projectId, tag_id: 10 },
      { id: 2, project_id: projectId, tag_id: 20 }
    ];
    ProjectTag.findAll.mockResolvedValue(mockProjectTags);
    
    const result = await repository.getTagsByProjectId(projectId);
    
    expect(ProjectTag.findAll).toHaveBeenCalledWith({
      where: { project_id: projectId },
      include: [{ model: Tag }]
    });
    expect(result).toEqual(mockProjectTags);
  });

  test('getProjectsByTagId should call findAll with correct parameters', async () => {
    const tagId = 10;
    const mockProjectTags = [
      { id: 1, project_id: 5, tag_id: tagId },
      { id: 2, project_id: 6, tag_id: tagId }
    ];
    ProjectTag.findAll.mockResolvedValue(mockProjectTags);
    
    const result = await repository.getProjectsByTagId(tagId);
    
    expect(ProjectTag.findAll).toHaveBeenCalledWith({
      where: { tag_id: tagId },
      include: [{ model: Project }]
    });
    expect(result).toEqual(mockProjectTags);
  });

  test('addTagToProject should call create with correct parameters', async () => {
    const projectId = 5;
    const tagId = 10;
    const mockProjectTag = { id: 1, project_id: projectId, tag_id: tagId };
    ProjectTag.create.mockResolvedValue(mockProjectTag);
    
    const result = await repository.addTagToProject(projectId, tagId);
    
    expect(ProjectTag.create).toHaveBeenCalledWith({
      project_id: projectId,
      tag_id: tagId
    });
    expect(result).toEqual(mockProjectTag);
  });

  test('removeTagFromProject should call destroy with correct parameters', async () => {
    const projectId = 5;
    const tagId = 10;
    const deleteCount = 1;
    ProjectTag.destroy.mockResolvedValue(deleteCount);
    
    const result = await repository.removeTagFromProject(projectId, tagId);
    
    expect(ProjectTag.destroy).toHaveBeenCalledWith({
      where: {
        project_id: projectId,
        tag_id: tagId
      }
    });
    expect(result).toEqual(deleteCount);
  });

  test('syncProjectTags should destroy existing tags and create new ones', async () => {
    const projectId = 5;
    const tagIds = [10, 20, 30];
    
    // Mock destroy and create responses
    const deleteCount = 3;
    ProjectTag.destroy.mockResolvedValue(deleteCount);
    
    const mockCreatedTags = [
      { id: 1, project_id: projectId, tag_id: 10 },
      { id: 2, project_id: projectId, tag_id: 20 },
      { id: 3, project_id: projectId, tag_id: 30 }
    ];
    
    // Mock each create call
    tagIds.forEach((tagId, index) => {
      ProjectTag.create.mockResolvedValueOnce(mockCreatedTags[index]);
    });
    
    const result = await repository.syncProjectTags(projectId, tagIds);
    
    // Should first delete all existing tags
    expect(ProjectTag.destroy).toHaveBeenCalledWith({
      where: { project_id: projectId }
    });
    
    // Should create a new tag for each ID
    tagIds.forEach(tagId => {
      expect(ProjectTag.create).toHaveBeenCalledWith({ 
        project_id: projectId, 
        tag_id: tagId 
      });
    });
    
    expect(result).toEqual(mockCreatedTags);
  });
}); 