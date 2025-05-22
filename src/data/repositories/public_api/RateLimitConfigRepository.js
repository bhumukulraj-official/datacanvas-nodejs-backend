const BaseRepository = require('../BaseRepository');
const RateLimitConfig = require('../../models/public_api/RateLimitConfig');

class RateLimitConfigRepository extends BaseRepository {
  constructor() {
    super(RateLimitConfig);
  }

  async findActiveConfigs() {
    return this.model.findAll({
      where: { is_active: true },
      order: [['endpoint_pattern', 'ASC']]
    });
  }

  async findByEndpointPattern(pattern) {
    return this.model.findAll({
      where: { endpoint_pattern: pattern },
      order: [['entity_type', 'ASC']]
    });
  }

  async findByEntityType(entityType) {
    return this.model.findAll({
      where: { entity_type: entityType },
      order: [['endpoint_pattern', 'ASC']]
    });
  }

  async toggleActive(id, isActive) {
    return this.model.update(
      { is_active: isActive },
      { where: { id } }
    );
  }
}

module.exports = new RateLimitConfigRepository(); 