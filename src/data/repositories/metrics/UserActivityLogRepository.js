const BaseRepository = require('../BaseRepository');
const { UserActivityLog } = require('../../models');

class UserActivityLogRepository extends BaseRepository {
  constructor() {
    super(UserActivityLog);
  }

  async getRecentActivities(userId, limit = 10) {
    return this.model.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit
    });
  }

  async getActivitiesByEntity(entityType, entityId) {
    return this.model.findAll({
      where: { entity_type: entityType, entity_id: entityId },
      order: [['created_at', 'DESC']]
    });
  }

  async getActivitiesByIP(ipAddress) {
    return this.model.findAll({
      where: { ip_address: ipAddress }
    });
  }
}

module.exports = UserActivityLogRepository; 