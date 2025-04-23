const { Sequelize } = require('sequelize');
const { sequelize } = require('../../../shared/database');
const logger = require('../../../shared/utils/logger');
const { Notification } = require('../models/Notification');

/**
 * Notification Analytics Service
 * Tracks and reports on notification metrics using existing fields in the notification model
 */
class NotificationAnalytics {
  /**
   * Track notification creation
   * @param {Object} notification - Notification object
   * @returns {Promise<void>}
   */
  static async trackCreation(notification) {
    try {
      // Store creation data in metadata
      const metadata = notification.metadata || {};
      
      metadata.analytics = {
        ...metadata.analytics,
        created: {
          timestamp: new Date().toISOString(),
          source: 'api',
        }
      };
      
      await Notification.update(
        { metadata },
        { where: { id: notification.id } }
      );
      
      logger.debug(`Tracked creation analytics for notification #${notification.id}`);
    } catch (error) {
      logger.error('Error tracking notification creation analytics', {
        error: error.message,
        notificationId: notification.id
      });
      // Don't throw - analytics tracking should not disrupt core functionality
    }
  }
  
  /**
   * Track notification being read
   * @param {Object} notification - Notification object
   * @param {String} source - Source of the read action (api, websocket, push)
   * @returns {Promise<void>}
   */
  static async trackRead(notification, source = 'api') {
    try {
      const metadata = notification.metadata || {};
      
      metadata.analytics = {
        ...metadata.analytics,
        read: {
          timestamp: new Date().toISOString(),
          source,
        }
      };
      
      // Calculate time to read (if created timestamp exists)
      if (metadata.analytics?.created?.timestamp) {
        const createdAt = new Date(metadata.analytics.created.timestamp);
        const readAt = new Date();
        const timeToReadMs = readAt.getTime() - createdAt.getTime();
        
        metadata.analytics.read.timeToReadMs = timeToReadMs;
        metadata.analytics.read.timeToReadFormatted = this.formatDuration(timeToReadMs);
      }
      
      await Notification.update(
        { metadata },
        { where: { id: notification.id } }
      );
      
      logger.debug(`Tracked read analytics for notification #${notification.id}`);
    } catch (error) {
      logger.error('Error tracking notification read analytics', {
        error: error.message,
        notificationId: notification.id
      });
      // Don't throw - analytics tracking should not disrupt core functionality
    }
  }
  
  /**
   * Track notification being clicked/acted upon
   * @param {Object} notification - Notification object
   * @param {String} action - Action taken
   * @param {String} source - Source of the action (api, websocket, push)
   * @returns {Promise<void>}
   */
  static async trackAction(notification, action, source = 'api') {
    try {
      const metadata = notification.metadata || {};
      
      metadata.analytics = {
        ...metadata.analytics,
        actions: [
          ...(metadata.analytics?.actions || []),
          {
            action,
            timestamp: new Date().toISOString(),
            source,
          }
        ]
      };
      
      await Notification.update(
        { metadata },
        { where: { id: notification.id } }
      );
      
      logger.debug(`Tracked action analytics for notification #${notification.id}`);
    } catch (error) {
      logger.error('Error tracking notification action analytics', {
        error: error.message,
        notificationId: notification.id
      });
      // Don't throw - analytics tracking should not disrupt core functionality
    }
  }
  
  /**
   * Format milliseconds into a human-readable duration
   * @param {Number} ms - Duration in milliseconds
   * @returns {String} Formatted duration
   */
  static formatDuration(ms) {
    if (ms < 1000) {
      return `${ms}ms`;
    }
    
    const seconds = Math.floor(ms / 1000);
    
    if (seconds < 60) {
      return `${seconds}s`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes < 60) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours < 24) {
      return `${hours}h ${remainingMinutes}m`;
    }
    
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    
    return `${days}d ${remainingHours}h`;
  }
  
  /**
   * Get notification analytics for a user
   * @param {Number} userId - User ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Analytics data
   */
  static async getUserAnalytics(userId, filters = {}) {
    try {
      // Define time ranges for queries
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      const startDate = filters.startDate || thirtyDaysAgo;
      const endDate = filters.endDate || now;
      
      // Base where clause
      const where = {
        user_id: userId,
        created_at: {
          [Sequelize.Op.between]: [startDate, endDate]
        }
      };
      
      // Apply type filter if provided
      if (filters.type) {
        where.type = filters.type;
      }
      
      // Get total notifications for user in time period
      const totalCount = await Notification.count({ where });
      
      // Get read count
      const readCount = await Notification.count({
        where: {
          ...where,
          read: true
        }
      });
      
      // Get count by type
      const typeBreakdown = await Notification.findAll({
        attributes: [
          'type',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
        ],
        where,
        group: ['type'],
        raw: true
      });
      
      // Get count by priority
      const priorityBreakdown = await Notification.findAll({
        attributes: [
          'priority',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
        ],
        where,
        group: ['priority'],
        raw: true
      });
      
      // Calculate read rate
      const readRate = totalCount > 0 ? (readCount / totalCount) * 100 : 0;
      
      return {
        totalNotifications: totalCount,
        readNotifications: readCount,
        readRate: Math.round(readRate * 100) / 100, // Round to 2 decimal places
        typeBreakdown: typeBreakdown.reduce((acc, item) => {
          acc[item.type] = parseInt(item.count, 10);
          return acc;
        }, {}),
        priorityBreakdown: priorityBreakdown.reduce((acc, item) => {
          acc[item.priority] = parseInt(item.count, 10);
          return acc;
        }, {}),
        dateRange: {
          start: startDate,
          end: endDate
        }
      };
    } catch (error) {
      logger.error('Error getting user notification analytics', {
        error: error.message,
        userId
      });
      throw error;
    }
  }
  
  /**
   * Get system-wide notification analytics
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Analytics data
   */
  static async getSystemAnalytics(filters = {}) {
    try {
      // Define time ranges for queries
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      const startDate = filters.startDate || thirtyDaysAgo;
      const endDate = filters.endDate || now;
      
      // Base where clause
      const where = {
        created_at: {
          [Sequelize.Op.between]: [startDate, endDate]
        }
      };
      
      // Apply type filter if provided
      if (filters.type) {
        where.type = filters.type;
      }
      
      // Get total notifications in time period
      const totalCount = await Notification.count({ where });
      
      // Get read count
      const readCount = await Notification.count({
        where: {
          ...where,
          read: true
        }
      });
      
      // Get count by type
      const typeBreakdown = await Notification.findAll({
        attributes: [
          'type',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
        ],
        where,
        group: ['type'],
        raw: true
      });
      
      // Get count by priority
      const priorityBreakdown = await Notification.findAll({
        attributes: [
          'priority',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
        ],
        where,
        group: ['priority'],
        raw: true
      });
      
      // Get daily notification counts
      const dailyCounts = await Notification.findAll({
        attributes: [
          [Sequelize.fn('DATE', Sequelize.col('created_at')), 'date'],
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
        ],
        where,
        group: [Sequelize.fn('DATE', Sequelize.col('created_at'))],
        order: [[Sequelize.fn('DATE', Sequelize.col('created_at')), 'ASC']],
        raw: true
      });
      
      // Calculate read rate
      const readRate = totalCount > 0 ? (readCount / totalCount) * 100 : 0;
      
      return {
        totalNotifications: totalCount,
        readNotifications: readCount,
        readRate: Math.round(readRate * 100) / 100, // Round to 2 decimal places
        typeBreakdown: typeBreakdown.reduce((acc, item) => {
          acc[item.type] = parseInt(item.count, 10);
          return acc;
        }, {}),
        priorityBreakdown: priorityBreakdown.reduce((acc, item) => {
          acc[item.priority] = parseInt(item.count, 10);
          return acc;
        }, {}),
        dailyCounts: dailyCounts.map(item => ({
          date: item.date,
          count: parseInt(item.count, 10)
        })),
        dateRange: {
          start: startDate,
          end: endDate
        }
      };
    } catch (error) {
      logger.error('Error getting system notification analytics', {
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = NotificationAnalytics; 