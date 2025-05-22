const BaseRepository = require('../BaseRepository');
const { Tag } = require('../../models');
const { Op } = require('sequelize');

class TagRepository extends BaseRepository {
  constructor() {
    super(Tag);
  }

  async findByName(name) {
    return this.model.findOne({
      where: { name }
    });
  }

  async findBySlug(slug) {
    return this.model.findOne({
      where: { slug }
    });
  }

  async findByCategory(category) {
    return this.model.findAll({
      where: { category }
    });
  }

  async getTechnologyTags() {
    return this.model.findAll({
      where: { is_technology: true }
    });
  }

  async searchTags(query) {
    return this.model.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: `%${query}%` } },
          { slug: { [Op.iLike]: `%${query}%` } }
        ]
      }
    });
  }

  async createIfNotExists(tagData) {
    const existingTag = await this.findByName(tagData.name);
    
    if (existingTag) {
      return existingTag;
    }
    
    return this.create(tagData);
  }
}

module.exports = TagRepository; 