const logger = require('../../../shared/utils/logger');
const NotificationAnalytics = require('../services/analytics.service');
const { Notification } = require('../models/Notification');

/**
 * Get notification analytics for current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Parse filter parameters
    const filters = {
      type: req.query.type,
      startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
    };
    
    const analytics = await NotificationAnalytics.getUserAnalytics(userId, filters);
    
    return res.status(200).json({
      status: 'success',
      data: analytics
    });
  } catch (error) {
    logger.error('Error getting user notification analytics', {
      error: error.message,
      userId: req.user?.id
    });
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get notification analytics',
      error: error.message
    });
  }
};

/**
 * Track notification action
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const trackNotificationAction = async (req, res) => {
  try {
    const { notificationId, action, source = 'api' } = req.body;
    const userId = req.user.id;
    
    if (!notificationId || !action) {
      return res.status(400).json({
        status: 'error',
        message: 'Notification ID and action are required'
      });
    }
    
    // Verify notification belongs to user
    const notification = await Notification.findOne({
      where: {
        id: notificationId,
        user_id: userId
      }
    });
    
    if (!notification) {
      return res.status(404).json({
        status: 'error',
        message: 'Notification not found'
      });
    }
    
    // Track the action
    await NotificationAnalytics.trackAction(notification, action, source);
    
    return res.status(200).json({
      status: 'success',
      message: 'Notification action tracked successfully'
    });
  } catch (error) {
    logger.error('Error tracking notification action', {
      error: error.message,
      userId: req.user?.id
    });
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to track notification action',
      error: error.message
    });
  }
};

/**
 * Get system-wide notification analytics (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getSystemAnalytics = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin privileges required.'
      });
    }
    
    // Parse filter parameters
    const filters = {
      type: req.query.type,
      startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
    };
    
    const analytics = await NotificationAnalytics.getSystemAnalytics(filters);
    
    return res.status(200).json({
      status: 'success',
      data: analytics
    });
  } catch (error) {
    logger.error('Error getting system notification analytics', {
      error: error.message,
      userId: req.user?.id
    });
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get system notification analytics',
      error: error.message
    });
  }
};

module.exports = {
  getUserAnalytics,
  trackNotificationAction,
  getSystemAnalytics
}; 