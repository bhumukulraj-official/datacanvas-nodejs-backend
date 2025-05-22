const BaseRepository = require('../BaseRepository');
const { WebsocketConnection } = require('../../models');
const { Op } = require('sequelize');

class WebsocketConnectionRepository extends BaseRepository {
  constructor() {
    super(WebsocketConnection);
  }

  async findByConnectionId(connectionId) {
    return this.model.findOne({
      where: { connection_id: connectionId }
    });
  }

  async getActiveConnectionsByUser(userId) {
    return this.model.findAll({
      where: {
        user_id: userId,
        connection_status: 'connected'
      }
    });
  }

  async updateStatus(connectionId, status) {
    const updates = { connection_status: status };
    
    if (status === 'disconnected') {
      updates.disconnected_at = new Date();
    }

    return this.model.update(updates, {
      where: { connection_id: connectionId }
    });
  }

  async updateLastPing(connectionId) {
    return this.model.update(
      { last_ping_at: new Date() },
      { where: { connection_id: connectionId } }
    );
  }

  async getIdleConnections(idleThreshold) {
    const thresholdDate = new Date(Date.now() - idleThreshold);
    
    return this.model.findAll({
      where: {
        connection_status: 'connected',
        last_ping_at: {
          [Op.lt]: thresholdDate
        }
      }
    });
  }

  async getConnectionsByStatus(status) {
    return this.model.findAll({
      where: { connection_status: status }
    });
  }
}

module.exports = WebsocketConnectionRepository; 