const BaseRepository = require('../BaseRepository');
const PublicApiView = require('../../models/public_api/PublicApiView');

class PublicApiViewRepository extends BaseRepository {
  constructor() {
    super(PublicApiView);
  }

  async findByName(name) {
    return this.model.findOne({
      where: { name }
    });
  }

  async findActiveViews() {
    return this.model.findAll({
      where: { is_active: true },
      order: [['name', 'ASC']]
    });
  }

  async findBySchema(schemaName) {
    return this.model.findAll({
      where: { schema_name: schemaName },
      order: [['name', 'ASC']]
    });
  }

  async updateViewDefinition(name, viewDefinition) {
    return this.model.update(
      { view_definition: viewDefinition },
      { where: { name } }
    );
  }

  async toggleActive(name, isActive) {
    return this.model.update(
      { is_active: isActive },
      { where: { name } }
    );
  }
}

module.exports = new PublicApiViewRepository(); 