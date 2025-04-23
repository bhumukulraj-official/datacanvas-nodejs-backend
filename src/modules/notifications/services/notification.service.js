const { Op } = require('sequelize');
const { Notification } = require('../models/Notification');
const logger = require('../../../shared/utils/logger');
const websocketNotificationService = require('../../websocket/services/notification.service');

/**
 * Create a new notification in the database
 * @param {Object} notificationData - Notification data
 * @param {Boolean} sendRealtime - Whether to send a real-time notification
 * @returns {Object} Created notification
 */
const createNotification = async (notificationData, sendRealtime = true) => {
  try {
    // Create notification in database
    const notification = await Notification.create(notificationData);

    // If real-time notification is enabled, send through websocket
    if (sendRealtime) {
      try {
        await websocketNotificationService.sendNotification(
          notificationData.user_id.toString(),
          {
            type: notification.type,
            title: notification.title,
            message: notification.message,
            category: notification.category,
            priority: notification.priority,
            dbId: notification.id,
            metadata: notification.metadata,
          }
        );
      } catch (wsError) {
        logger.error('Failed to send real-time notification', {
          error: wsError.message,
          notificationId: notification.id,
        });
      }
    }

    return notification;
  } catch (error) {
    logger.error('Error creating notification', {
      error: error.message,
      userData: notificationData,
    });
    throw error;
  }
};

/**
 * Get notifications for a user with filters
 * @param {Number} userId - User ID
 * @param {Object} filters - Filter options
 * @param {Object} pagination - Pagination options
 * @returns {Object} Filtered notifications and pagination info
 */
const getUserNotifications = async (userId, filters = {}, pagination = {}) => {
  try {
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;
    
    // Build where clause
    const where = { user_id: userId };
    
    // Apply filters
    if (filters.read !== undefined) {
      where.read = filters.read;
    }
    
    if (filters.type) {
      where.type = filters.type;
    }
    
    if (filters.status) {
      where.status = filters.status;
    }
    
    if (filters.priority) {
      where.priority = filters.priority;
    }
    
    if (filters.category) {
      where.category = filters.category;
    }
    
    // Apply date range filter if provided
    if (filters.startDate && filters.endDate) {
      where.created_at = {
        [Op.between]: [filters.startDate, filters.endDate]
      };
    } else if (filters.startDate) {
      where.created_at = {
        [Op.gte]: filters.startDate
      };
    } else if (filters.endDate) {
      where.created_at = {
        [Op.lte]: filters.endDate
      };
    }
    
    // Get count of total notifications matching filters
    const count = await Notification.count({ where });
    
    // Get notifications with pagination
    const notifications = await Notification.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });
    
    return {
      notifications,
      pagination: {
        total: count,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(count / limit),
      },
    };
  } catch (error) {
    logger.error('Error getting user notifications', {
      error: error.message,
      userId,
      filters,
    });
    throw error;
  }
};

/**
 * Mark a notification as read
 * @param {Number} notificationId - Notification ID
 * @param {Number} userId - User ID
 * @returns {Object} Updated notification
 */
const markAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOne({
      where: {
        id: notificationId,
        user_id: userId,
      },
    });
    
    if (!notification) {
      throw new Error('Notification not found');
    }
    
    // Update notification
    await notification.update({
      read: true,
      status: 'read',
    });
    
    return notification;
  } catch (error) {
    logger.error('Error marking notification as read', {
      error: error.message,
      notificationId,
      userId,
    });
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 * @param {Number} userId - User ID
 * @returns {Number} Count of updated notifications
 */
const markAllAsRead = async (userId) => {
  try {
    const result = await Notification.update(
      {
        read: true,
        status: 'read',
      },
      {
        where: {
          user_id: userId,
          read: false,
        },
      }
    );
    
    return result[0]; // Number of updated notifications
  } catch (error) {
    logger.error('Error marking all notifications as read', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Delete a notification
 * @param {Number} notificationId - Notification ID
 * @param {Number} userId - User ID
 * @returns {Boolean} Success status
 */
const deleteNotification = async (notificationId, userId) => {
  try {
    const result = await Notification.destroy({
      where: {
        id: notificationId,
        user_id: userId,
      },
    });
    
    return result > 0;
  } catch (error) {
    logger.error('Error deleting notification', {
      error: error.message,
      notificationId,
      userId,
    });
    throw error;
  }
};

/**
 * Create a system notification for multiple users
 * @param {Array} userIds - Array of user IDs
 * @param {Object} notificationData - Base notification data
 * @returns {Array} Created notifications
 */
const createBulkNotifications = async (userIds, notificationData) => {
  try {
    const notifications = [];
    const bulkData = userIds.map(userId => ({
      ...notificationData,
      user_id: userId,
    }));
    
    // Create notifications in bulk
    const created = await Notification.bulkCreate(bulkData);
    
    // Send real-time notifications
    for (const notification of created) {
      try {
        await websocketNotificationService.sendNotification(
          notification.user_id.toString(),
          {
            type: notification.type,
            title: notification.title,
            message: notification.message,
            category: notification.category,
            priority: notification.priority,
            dbId: notification.id,
            metadata: notification.metadata,
          }
        );
        notifications.push(notification);
      } catch (wsError) {
        logger.error('Failed to send real-time notification', {
          error: wsError.message,
          notificationId: notification.id,
        });
        notifications.push(notification);
      }
    }
    
    return notifications;
  } catch (error) {
    logger.error('Error creating bulk notifications', {
      error: error.message,
      userCount: userIds.length,
    });
    throw error;
  }
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createBulkNotifications,
}; 