const skillService = require('../../../../src/services/content/skill.service');
const { SkillRepository } = require('../../../../src/data/repositories/content');
const { CustomError } = require('../../../../src/utils/error.util');
const logger = require('../../../../src/utils/logger.util');

// Mock the repository
jest.mock('../../../../src/data/repositories/content', () => ({
  SkillRepository: jest.fn()
}));

// Mock logger
jest.mock('../../../../src/utils/logger.util', () => ({
  info: jest.fn(),
  error: jest.fn()
}));

describe('SkillService', () => {
  let mockSkillRepository;
  
  beforeEach(() => {
    // Create new instance of mocked repository
    mockSkillRepository = new SkillRepository();
    
    // Reset mock implementations
    jest.clearAllMocks();
    
    // Initialize mock methods
    mockSkillRepository.getByCategory = jest.fn();
    mockSkillRepository.update = jest.fn();
    mockSkillRepository.findById = jest.fn();
    
    // Mock repository on the service
    skillService.skillRepo = mockSkillRepository;
  });

  describe('getHighlightedSkills', () => {
    test('should return highlighted skills', async () => {
      // Mock highlighted skills
      const mockSkills = [
        {
          id: 1,
          name: 'JavaScript',
          category: 'language',
          proficiency: 5,
          is_highlighted: true
        },
        {
          id: 2,
          name: 'React',
          category: 'framework',
          proficiency: 4,
          is_highlighted: true
        }
      ];
      
      mockSkillRepository.getHighlightedSkills = jest.fn().mockResolvedValue(mockSkills);
      
      // Call the service method
      const result = await skillService.getHighlightedSkills();
      
      // Assertions
      expect(mockSkillRepository.getHighlightedSkills).toHaveBeenCalled();
      expect(result).toEqual(mockSkills);
    });
  });

  describe('getSkillsByCategory', () => {
    test('should return skills for a valid category', async () => {
      // Mock category skills
      const mockSkills = [
        {
          id: 1,
          name: 'JavaScript',
          category: 'language',
          proficiency: 5
        },
        {
          id: 3,
          name: 'TypeScript',
          category: 'language',
          proficiency: 4
        }
      ];
      
      mockSkillRepository.getByCategory = jest.fn().mockResolvedValue(mockSkills);
      
      // Call the service method
      const result = await skillService.getSkillsByCategory('language');
      
      // Assertions
      expect(mockSkillRepository.getByCategory).toHaveBeenCalledWith('language');
      expect(result).toEqual(mockSkills);
    });
    
    test('should throw error for invalid category', async () => {
      // Call the service method and expect it to throw
      await expect(
        skillService.getSkillsByCategory('invalid_category')
      ).rejects.toThrow(CustomError);
      
      // Assertions
      expect(mockSkillRepository.getByCategory).not.toHaveBeenCalled();
    });
  });

  describe('updateSkillProficiency', () => {
    test('should update skill proficiency successfully', async () => {
      // Mock updated skill
      const mockUpdatedSkill = {
        id: 1,
        name: 'JavaScript',
        category: 'language',
        proficiency: 5,
        updated_at: new Date()
      };
      
      mockSkillRepository.update = jest.fn().mockResolvedValue([1]);
      mockSkillRepository.findById = jest.fn().mockResolvedValue(mockUpdatedSkill);
      
      // Call the service method
      const result = await skillService.updateSkillProficiency(1, 5);
      
      // Assertions
      expect(mockSkillRepository.update).toHaveBeenCalledWith(1, { proficiency: 5 });
      expect(mockSkillRepository.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUpdatedSkill);
    });
    
    test('should throw error if proficiency is out of range', async () => {
      // Call the service method with invalid proficiency and expect it to throw
      await expect(
        skillService.updateSkillProficiency(1, 6) // Proficiency must be 1-5
      ).rejects.toThrow(CustomError);
      
      // Also test with too low proficiency
      await expect(
        skillService.updateSkillProficiency(1, 0) // Proficiency must be 1-5
      ).rejects.toThrow(CustomError);
      
      // Assertions
      expect(mockSkillRepository.update).not.toHaveBeenCalled();
    });
    
    test('should throw error if skill not found', async () => {
      // Mock update to return 0 affected rows (skill not found)
      mockSkillRepository.update = jest.fn().mockResolvedValue([0]);
      
      // Call the service method and expect it to throw
      await expect(
        skillService.updateSkillProficiency(999, 4)
      ).rejects.toThrow(CustomError);
      
      // Assertions
      expect(mockSkillRepository.update).toHaveBeenCalledWith(999, { proficiency: 4 });
      expect(mockSkillRepository.findById).not.toHaveBeenCalled();
    });
  });
}); 