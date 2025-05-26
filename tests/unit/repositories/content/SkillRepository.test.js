const { SkillRepository } = require('../../../../src/data/repositories/content');
const { Skill } = require('../../../../src/data/models');
const { Op } = require('sequelize');

// Mock the models
jest.mock('../../../../src/data/models', () => ({
  Skill: {
    findAll: jest.fn()
  }
}));

// Mock sequelize Op
jest.mock('sequelize', () => ({
  Op: {
    gte: Symbol('gte')
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

describe('SkillRepository', () => {
  let repository;
  
  beforeEach(() => {
    repository = new SkillRepository();
    jest.clearAllMocks();
  });

  test('getHighlightedSkills should call findAll with correct parameters', async () => {
    const mockSkills = [
      { id: 1, name: 'JavaScript', is_highlighted: true, display_order: 1 },
      { id: 2, name: 'React', is_highlighted: true, display_order: 2 }
    ];
    
    Skill.findAll.mockResolvedValue(mockSkills);
    
    const result = await repository.getHighlightedSkills();
    
    expect(Skill.findAll).toHaveBeenCalledWith({
      where: { is_highlighted: true },
      order: [['display_order', 'ASC']]
    });
    expect(result).toEqual(mockSkills);
  });

  test('getByCategory should call findAll with correct parameters', async () => {
    const category = 'frontend';
    const mockSkills = [
      { id: 1, name: 'JavaScript', category, proficiency: 90 },
      { id: 2, name: 'React', category, proficiency: 85 }
    ];
    
    Skill.findAll.mockResolvedValue(mockSkills);
    
    const result = await repository.getByCategory(category);
    
    expect(Skill.findAll).toHaveBeenCalledWith({
      where: { category },
      order: [['proficiency', 'DESC']]
    });
    expect(result).toEqual(mockSkills);
  });

  test('getByProficiency should call findAll with correct parameters', async () => {
    const minLevel = 80;
    const mockSkills = [
      { id: 1, name: 'JavaScript', proficiency: 90 },
      { id: 2, name: 'React', proficiency: 85 }
    ];
    
    Skill.findAll.mockResolvedValue(mockSkills);
    
    const result = await repository.getByProficiency(minLevel);
    
    expect(Skill.findAll).toHaveBeenCalledWith({
      where: {
        proficiency: {
          [Op.gte]: minLevel
        }
      }
    });
    expect(result).toEqual(mockSkills);
  });
}); 