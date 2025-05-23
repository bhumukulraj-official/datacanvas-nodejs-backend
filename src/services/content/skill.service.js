const { SkillRepository } = require('../../../data/repositories/content');
const { CustomError } = require('../../utils/error.util');

class SkillService {
  constructor() {
    this.skillRepo = new SkillRepository();
  }

  async getHighlightedSkills() {
    return this.skillRepo.getHighlightedSkills();
  }

  async getSkillsByCategory(category) {
    const validCategories = ['language', 'framework', 'tool', 'database'];
    if (!validCategories.includes(category)) {
      throw new CustomError('Invalid skill category', 400);
    }
    
    return this.skillRepo.getByCategory(category);
  }

  async updateSkillProficiency(id, proficiency) {
    if (proficiency < 1 || proficiency > 5) {
      throw new CustomError('Proficiency must be between 1-5', 400);
    }
    
    const [affectedCount] = await this.skillRepo.update(id, { proficiency });
    if (affectedCount === 0) {
      throw new CustomError('Skill not found', 404);
    }
    
    return this.skillRepo.findById(id);
  }
}

module.exports = new SkillService(); 