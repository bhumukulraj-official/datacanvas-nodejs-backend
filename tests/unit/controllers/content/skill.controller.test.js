const skillController = require('../../../../src/api/controllers/content/skill.controller');
const { SkillService } = require('../../../../src/services/content');

// Mock the SkillService
jest.mock('../../../../src/services/content/skill.service', () => ({
  getHighlightedSkills: jest.fn(),
  getSkillsByCategory: jest.fn(),
  updateSkillProficiency: jest.fn()
}));

describe('SkillController', () => {
  let mockReq;
  let mockRes;
  let mockNext;
  
  beforeEach(() => {
    // Mock request, response, and next
    mockReq = {
      params: {
        category: 'frontend',
        id: 'skill-123'
      },
      body: {
        proficiency: 90
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

  describe('getHighlightedSkills', () => {
    test('should get highlighted skills successfully', async () => {
      const mockSkills = [
        { id: 'skill-1', name: 'React', category: 'frontend', highlighted: true },
        { id: 'skill-2', name: 'Node.js', category: 'backend', highlighted: true }
      ];
      
      // Mock the getHighlightedSkills service method
      SkillService.getHighlightedSkills.mockResolvedValue(mockSkills);
      
      await skillController.getHighlightedSkills(mockReq, mockRes, mockNext);
      
      expect(SkillService.getHighlightedSkills).toHaveBeenCalled();
      
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockSkills
      });
    });
    
    test('should call next with error on failure', async () => {
      const mockError = new Error('Failed to get highlighted skills');
      
      // Mock the getHighlightedSkills service method to throw an error
      SkillService.getHighlightedSkills.mockRejectedValue(mockError);
      
      await skillController.getHighlightedSkills(mockReq, mockRes, mockNext);
      
      expect(SkillService.getHighlightedSkills).toHaveBeenCalled();
      
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('getSkillsByCategory', () => {
    test('should get skills by category successfully', async () => {
      const mockSkills = [
        { id: 'skill-1', name: 'React', category: 'frontend', proficiency: 90 },
        { id: 'skill-2', name: 'Angular', category: 'frontend', proficiency: 80 }
      ];
      
      // Mock the getSkillsByCategory service method
      SkillService.getSkillsByCategory.mockResolvedValue(mockSkills);
      
      await skillController.getSkillsByCategory(mockReq, mockRes, mockNext);
      
      expect(SkillService.getSkillsByCategory).toHaveBeenCalledWith(
        mockReq.params.category
      );
      
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockSkills
      });
    });
    
    test('should call next with error on failure', async () => {
      const mockError = new Error('Failed to get skills by category');
      
      // Mock the getSkillsByCategory service method to throw an error
      SkillService.getSkillsByCategory.mockRejectedValue(mockError);
      
      await skillController.getSkillsByCategory(mockReq, mockRes, mockNext);
      
      expect(SkillService.getSkillsByCategory).toHaveBeenCalledWith(
        mockReq.params.category
      );
      
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('updateSkillProficiency', () => {
    test('should update skill proficiency successfully', async () => {
      const mockSkill = {
        id: 'skill-123',
        name: 'React',
        category: 'frontend',
        proficiency: 90
      };
      
      // Mock the updateSkillProficiency service method
      SkillService.updateSkillProficiency.mockResolvedValue(mockSkill);
      
      await skillController.updateSkillProficiency(mockReq, mockRes, mockNext);
      
      expect(SkillService.updateSkillProficiency).toHaveBeenCalledWith(
        mockReq.params.id,
        mockReq.body.proficiency
      );
      
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockSkill
      });
    });
    
    test('should call next with error on failure', async () => {
      const mockError = new Error('Failed to update skill proficiency');
      
      // Mock the updateSkillProficiency service method to throw an error
      SkillService.updateSkillProficiency.mockRejectedValue(mockError);
      
      await skillController.updateSkillProficiency(mockReq, mockRes, mockNext);
      
      expect(SkillService.updateSkillProficiency).toHaveBeenCalledWith(
        mockReq.params.id,
        mockReq.body.proficiency
      );
      
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });
}); 