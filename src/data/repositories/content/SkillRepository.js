const BaseRepository = require('../BaseRepository');
const { Skill } = require('../../models');
const { Op } = require('sequelize');

class SkillRepository extends BaseRepository {
  constructor() {
    super(Skill);
  }

  async getHighlightedSkills() {
    return this.model.findAll({
      where: { is_highlighted: true },
      order: [['display_order', 'ASC']]
    });
  }

  async getByCategory(category) {
    return this.model.findAll({
      where: { category },
      order: [['proficiency', 'DESC']]
    });
  }

  async getByProficiency(minLevel) {
    return this.model.findAll({
      where: {
        proficiency: {
          [Op.gte]: minLevel
        }
      }
    });
  }
}

module.exports = SkillRepository; 