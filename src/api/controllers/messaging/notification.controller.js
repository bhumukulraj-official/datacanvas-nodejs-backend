const { NotificationService } = require('../../../services/messaging');
const { authenticate } = require('../../middlewares/auth.middleware');

class NotificationController {
  async getNotifications(req, res, next) {
    try {
      const notifications = await NotificationService.getUserNotifications(
        req.user.id,
        req.query.limit
      );
      res.json({
        success: true,
        data: notifications
      });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req, res, next) {
    try {
      await NotificationService.markAsRead(
        req.params.notificationId,
        req.user.id
      );
      res.json({
        success: true
      });
    } catch (error) {
      next(error);
    }
  }

  async clearNotifications(req, res, next) {
    try {
      await NotificationService.clearAllNotifications(req.user.id);
      res.json({
        success: true
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController(); 