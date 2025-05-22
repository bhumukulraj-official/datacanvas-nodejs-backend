const BaseRepository = require('../BaseRepository');
const RateLimit = require('../../models/public_api/RateLimit');
const { Op } = require('sequelize');

class RateLimitRepository extends BaseRepository {
  constructor() {
    super(RateLimit);
  }

  async findActiveByEntityAndEndpoint(entityType, entityIdentifier, endpoint) {
    const now = new Date();
    return this.model.findAll({
      where: {
        entity_type: entityType,
        entity_identifier: entityIdentifier,
        endpoint,
        window_start: {
          [Op.lte]: now
        }
      },
      order: [['window_start', 'DESC']]
    });
  }

  async incrementRequestCount(id) {
    return this.model.increment('requests_count', {
      where: { id }
    });
  }

  async cleanupExpiredLimits() {
    const now = new Date();
    return this.model.destroy({
      where: {
        window_start: {
          [Op.lt]: now
        }
      }
    });
  }
}

module.exports = new RateLimitRepository(); 