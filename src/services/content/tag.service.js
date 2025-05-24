const { TagRepository } = require('../../data/repositories/content');
const { validation } = require('../../utils/validation.util');
const { CustomError } = require('../../utils/error.util');
const logger = require('../../utils/logger.util');

class TagService {
  constructor() {
    try {
      this.tagRepo = new TagRepository();
      logger.info('TagService initialized with repository');
    } catch (error) {
      logger.error('Error initializing TagService repositories:', error);
      throw error;
    }
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