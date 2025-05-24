const { NotificationRepository } = require('../../data/repositories/messaging');
const { CustomError } = require('../../utils/error.util');

class NotificationService {
  constructor() {
    this.notificationRepo = new NotificationRepository();
  }

  async createNotification(userId, type, data) {
    return this.notificationRepo.create({
      user_id: userId,
      type,
      data: JSON.stringify(data),
      is_read: false
    });
  }

  async getUserNotifications(userId, limit = 20) {
    return this.notificationRepo.getByUser(userId, limit);
  }

  async markAsRead(notificationId, userId) {
    const [affectedCount] = await this.notificationRepo.markAsRead(notificationId, userId);
    if (affectedCount === 0) {
      throw new CustomError('Notification not found', 404);
    }
    return true;
  }

  async clearAllNotifications(userId) {
    return this.notificationRepo.markAllAsRead(userId);
  }
}

module.exports = new NotificationService(); 