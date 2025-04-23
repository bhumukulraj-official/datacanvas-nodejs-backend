const { Op } = require('sequelize');
const notificationService = require('../services/notification.service');
const { ApiError } = require('../../../shared/utils/ApiError');

/**
 * Get user notifications with pagination and filters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      page = 1,
      limit = 10,
      read,
      type,
      priority,
      status,
      category,
      startDate,
      endDate
    } = req.query;

    // Prepare filters
    const filters = {};
    
    if (read !== undefined) {
      filters.read = read === 'true';
    }
    
    if (type) {
      filters.type = type;
    }
    
    if (priority) {
      filters.priority = priority;
    }
    
    if (status) {
      filters.status = status;
    }
    
    if (category) {
      filters.category = category;
    }
    
    if (startDate) {
      filters.startDate = new Date(startDate);
    }
    
    if (endDate) {
      filters.endDate = new Date(endDate);
    }
    
    // Get notifications
    const { notifications, pagination } = await notificationService.getUserNotifications(
      userId,
      filters,
      { page: parseInt(page, 10), limit: parseInt(limit, 10) }
    );

    res.json({
      success: true,
      data: {
        notifications,
        pagination,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark a notification as read
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    try {
      const notification = await notificationService.markAsRead(id, userId);
      
      res.json({
        success: true,
        data: {
          id: notification.id,
          read: notification.read,
          status: notification.status,
          updatedAt: notification.updated_at,
        },
      });
    } catch (error) {
      if (error.message === 'Notification not found') {
        throw new ApiError('Notification not found', 404, 'NOT_001');
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all notifications as read for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const count = await notificationService.markAllAsRead(userId);

    res.json({
      success: true,
      data: {
        count,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new notification
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.createNotification = async (req, res, next) => {
  try {
    // Admin-only endpoint
    if (req.user.role !== 'admin') {
      throw new ApiError('Unauthorized', 403, 'AUTH_003');
    }
    
    const notificationData = req.body;
    const notification = await notificationService.createNotification(notificationData);
    
    res.status(201).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a notification
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const success = await notificationService.deleteNotification(id, userId);
    
    if (!success) {
      throw new ApiError('Notification not found', 404, 'NOT_001');
    }
    
    res.json({
      success: true,
      data: {
        id: parseInt(id, 10),
        deleted: true,
      },
    });
  } catch (error) {
    next(error);
  }
}; 