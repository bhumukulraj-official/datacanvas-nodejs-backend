const logger = require('../../../shared/utils/logger');
const messageService = require('./message.service');

class NotificationService {
  constructor() {
    this.pendingNotifications = new Map();
  }

  /**
   * Send notification to specific user
   * @param {String} userId - User ID
   * @param {Object} notification - Notification object
   * @param {Object} options - Notification options
   */
  async sendNotification(userId, notification, options = {}) {
    try {
      const notificationId = this.generateNotificationId();
      const timestamp = new Date().toISOString();

      const notificationData = {
        id: notificationId,
        timestamp,
        ...notification,
        requiresAck: options.requiresAck || false,
        expiresAt: options.expiresAt || null
      };

      // If acknowledgment is required, track the notification
      if (options.requiresAck) {
        this.trackPendingNotification(userId, notificationId, notificationData);
      }

      // Send notification through WebSocket
      messageService.sendToUser(userId, 'notification', notificationData);

      logger.info('Notification sent:', {
        userId,
        notificationId,
        type: notification.type
      });

      return notificationId;
    } catch (error) {
      logger.error('Failed to send notification:', error);
      throw error;
    }
  }

  /**
   * Broadcast notification to all connected users
   * @param {Object} notification - Notification object
   * @param {Object} options - Notification options
   */
  async broadcastNotification(notification, options = {}) {
    try {
      const notificationId = this.generateNotificationId();
      const timestamp = new Date().toISOString();

      const notificationData = {
        id: notificationId,
        timestamp,
        ...notification,
        requiresAck: options.requiresAck || false,
        expiresAt: options.expiresAt || null
      };

      // Send notification through WebSocket
      messageService.broadcast('notification', notificationData);

      logger.info('Broadcast notification sent:', {
        notificationId,
        type: notification.type
      });

      return notificationId;
    } catch (error) {
      logger.error('Failed to broadcast notification:', error);
      throw error;
    }
  }

  /**
   * Handle notification acknowledgment
   * @param {String} userId - User ID
   * @param {String} notificationId - Notification ID
   */
  async handleNotificationAck(userId, notificationId) {
    try {
      const userPending = this.pendingNotifications.get(userId);
      
      if (!userPending || !userPending.has(notificationId)) {
        logger.warn('Acknowledgment received for unknown notification:', {
          userId,
          notificationId
        });
        return false;
      }

      // Remove from pending notifications
      userPending.delete(notificationId);
      
      // Clean up user map if empty
      if (userPending.size === 0) {
        this.pendingNotifications.delete(userId);
      }

      logger.debug('Notification acknowledged:', {
        userId,
        notificationId
      });

      return true;
    } catch (error) {
      logger.error('Error handling notification acknowledgment:', error);
      return false;
    }
  }

  /**
   * Track pending notification
   * @param {String} userId - User ID
   * @param {String} notificationId - Notification ID
   * @param {Object} notificationData - Notification data
   */
  trackPendingNotification(userId, notificationId, notificationData) {
    if (!this.pendingNotifications.has(userId)) {
      this.pendingNotifications.set(userId, new Map());
    }

    const userPending = this.pendingNotifications.get(userId);
    userPending.set(notificationId, {
      ...notificationData,
      sentAt: new Date()
    });

    // Set expiration if specified
    if (notificationData.expiresAt) {
      const timeout = new Date(notificationData.expiresAt) - new Date();
      if (timeout > 0) {
        setTimeout(() => {
          this.handleNotificationExpiration(userId, notificationId);
        }, timeout);
      }
    }
  }

  /**
   * Handle notification expiration
   * @param {String} userId - User ID
   * @param {String} notificationId - Notification ID
   */
  handleNotificationExpiration(userId, notificationId) {
    const userPending = this.pendingNotifications.get(userId);
    if (userPending && userPending.has(notificationId)) {
      userPending.delete(notificationId);
      
      if (userPending.size === 0) {
        this.pendingNotifications.delete(userId);
      }

      logger.debug('Notification expired:', {
        userId,
        notificationId
      });
    }
  }

  /**
   * Get pending notifications for user
   * @param {String} userId - User ID
   * @returns {Array} Array of pending notifications
   */
  getPendingNotifications(userId) {
    const userPending = this.pendingNotifications.get(userId);
    if (!userPending) {
      return [];
    }

    return Array.from(userPending.values());
  }

  /**
   * Generate unique notification ID
   * @returns {String} Notification ID
   */
  generateNotificationId() {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new NotificationService(); 