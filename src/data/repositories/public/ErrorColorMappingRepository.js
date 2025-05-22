const BaseRepository = require('../BaseRepository');
const ErrorColorMapping = require('../../models/public/ErrorColorMapping');

class ErrorColorMappingRepository extends BaseRepository {
  constructor() {
    super(ErrorColorMapping);
  }

  async findByCategory(errorCategory) {
    return this.model.findOne({
      where: { error_category: errorCategory }
    });
  }

  async getAllCategories() {
    return this.model.findAll({
      attributes: ['error_category', 'ui_color', 'hex_code', 'usage_description'],
      order: [['error_category', 'ASC']]
    });
  }
}

module.exports = new ErrorColorMappingRepository(); 