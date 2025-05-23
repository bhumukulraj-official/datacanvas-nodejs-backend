const { TagRepository } = require('../../../data/repositories/content');
const { validation } = require('../../utils/validation.util');
const { CustomError } = require('../../utils/error.util');

class TagService {
  constructor() {
    this.tagRepo = new TagRepository();
  }

  async createTag(tagData) {
    const existing = await this.tagRepo.findByName(tagData.name);
    if (existing) {
      throw new CustomError('Tag already exists', 409);
    }

    return this.tagRepo.create({
      ...tagData,
      slug: validation.slugify(tagData.name)
    });
  }

  async searchTags(query) {
    return this.tagRepo.searchTags(query);
  }

  async getTechnologyTags() {
    return this.tagRepo.getTechnologyTags();
  }

  async updateTag(id, updateData) {
    const [affectedCount] = await this.tagRepo.update(id, updateData);
    if (affectedCount === 0) {
      throw new CustomError('Tag not found', 404);
    }
    return this.tagRepo.findById(id);
  }
}

module.exports = new TagService(); 