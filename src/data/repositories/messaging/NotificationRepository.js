const BaseRepository = require('../BaseRepository');
const { Notification } = require('../../models');
const { Op } = require('sequelize');

class NotificationRepository extends BaseRepository {
  constructor() {
    super(Notification);
  }

  async findByUuid(uuid) {
    return this.model.findOne({ where: { uuid } });
  }

  async getByUser(userId, limit = 20, offset = 0) {
    return this.model.findAndCountAll({
      where: { 
        user_id: userId,
        is_deleted: false 
      },
      order: [['created_at', 'DESC']],
      limit,
      offset
    });
  }

  async getUnreadByUser(userId) {
    return this.model.findAll({
      where: {
        user_id: userId,
        is_read: false,
        is_deleted: false
      },
      order: [['created_at', 'DESC']]
    });
  }

  async markAsRead(notificationId, userId) {
    return this.model.update(
      { 
        is_read: true,
        read_at: new Date()
      },
      {
        where: {
          id: notificationId,
          user_id: userId,
          is_deleted: false
        }
      }
    );
  }

  async markAllAsRead(userId) {
    return this.model.update(
      { 
        is_read: true,
        read_at: new Date()
      },
      {
        where: {
          user_id: userId,
          is_read: false,
          is_deleted: false
        }
      }
    );
  }

  async getByType(userId, type) {
    return this.model.findAll({
      where: {
        user_id: userId,
        type,
        is_deleted: false
      },
      order: [['created_at', 'DESC']]
    });
  }
}

module.exports = NotificationRepository; 