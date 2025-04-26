const { Op } = require('sequelize');
const { sequelize } = require('../../../shared/database');
const { Notification } = require('../models/Notification');
const User = require('../../auth/models/User');
const logger = require('../../../shared/utils/logger');
const websocketNotificationService = require('../../websocket/services/notification.service');
const emailNotificationService = require('./email.service');
const pushNotificationService = require('./push.service');
const preferenceService = require('./preference.service');
const emailService = require('../../email/services/email.service');
const NotificationAnalytics = require('./analytics.service');

/**
 * Create a new notification in the database
 * @param {Object} notificationData - Notification data
 * @param {Boolean} sendRealtime - Whether to send a real-time notification
 * @param {Boolean} sendEmail - Whether to send an email notification
 * @param {Boolean} sendPush - Whether to send a push notification
 * @returns {Object} Created notification
 */
const createNotification = async (notificationData, sendRealtime = true, sendEmail = true, sendPush = true) => {
  try {
    // Check user preferences if they want to receive this type of notification
    if (notificationData.user_id) {
      try {
        const shouldReceive = await preferenceService.shouldSendNotification(
          notificationData.user_id,
          { type: notificationData.type },
          'any'
        );
        
        if (!shouldReceive) {
          logger.info(`User ${notificationData.user_id} has opted out of ${notificationData.type} notifications, skipping`);
          return null;
        }
      } catch (prefError) {
        // Log but continue - default to sending if preference check fails
        logger.warn(`Error checking notification preferences: ${prefError.message}, continuing with notification`);
      }
    }
    
    // Create notification in database
    const notification = await Notification.create(notificationData);
    logger.info(`Created notification #${notification.id} for user ${notification.user_id}`);

    // Track notification creation for analytics
    await NotificationAnalytics.trackCreation(notification);

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
        logger.info(`Sent real-time notification #${notification.id} to user ${notification.user_id}`);
      } catch (wsError) {
        logger.error('Failed to send real-time notification', {
          error: wsError.message,
          notificationId: notification.id,
        });
      }
    }

    // If email notification is enabled, send email
    if (sendEmail) {
      try {
        // Check if user wants email notifications for this type
        const shouldSendEmail = await preferenceService.shouldSendNotification(
          notificationData.user_id,
          notification,
          'email'
        );
        
        if (shouldSendEmail) {
          await emailNotificationService.sendEmailNotification(notification, notificationData.user_id);
          logger.info(`Sent email notification #${notification.id} to user ${notification.user_id}`);
        } else {
          logger.info(`Skipped email for notification #${notification.id} based on user preferences`);
        }
      } catch (emailError) {
        logger.error('Failed to send email notification', {
          error: emailError.message,
          notificationId: notification.id,
        });
        // Don't rethrow - email failure shouldn't prevent notification creation
      }
    }

    // If push notification is enabled, send push notification
    if (sendPush) {
      try {
        // Check if user wants push notifications for this type
        const shouldSendPush = await preferenceService.shouldSendNotification(
          notificationData.user_id,
          notification,
          'push'
        );
        
        if (shouldSendPush) {
          await pushNotificationService.sendPushNotification(notification, notificationData.user_id);
          logger.info(`Sent push notification #${notification.id} to user ${notification.user_id}`);
        } else {
          logger.info(`Skipped push notification for #${notification.id} based on user preferences`);
        }
      } catch (pushError) {
        logger.error('Failed to send push notification', {
          error: pushError.message,
          notificationId: notification.id,
        });
        // Don't rethrow - push failure shouldn't prevent notification creation
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
 * @param {String} source - Source of the read action (api, websocket, push)
 * @returns {Object} Updated notification
 */
const markAsRead = async (notificationId, userId, source = 'api') => {
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

    // Only track analytics if notification wasn't already read
    if (!notification.read) {
      // Track notification read event for analytics
      await NotificationAnalytics.trackRead(notification, source);
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
 * @param {Boolean} sendRealtime - Whether to send a real-time notification
 * @param {Boolean} sendEmail - Whether to send an email notification
 * @param {Boolean} sendPush - Whether to send a push notification
 * @returns {Array} Created notifications
 */
const createBulkNotifications = async (userIds, notificationData, sendRealtime = true, sendEmail = true, sendPush = true) => {
  try {
    // Filter out users who have opted out of this notification type
    const filteredUsers = [];
    const skippedUsers = [];

    for (const userId of userIds) {
      try {
        const shouldReceive = await preferenceService.shouldSendNotification(
          userId,
          { type: notificationData.type },
          'any'
        );
        
        if (shouldReceive) {
          filteredUsers.push(userId);
        } else {
          skippedUsers.push(userId);
        }
      } catch (prefError) {
        logger.warn(`Error checking preferences for user ${userId}: ${prefError.message}, including user`);
        // Default to including the user if preference check fails
        filteredUsers.push(userId);
      }
    }
    
    if (skippedUsers.length > 0) {
      logger.info(`Skipped notifications for ${skippedUsers.length} users due to preferences`, { skippedUsers });
    }
    
    if (filteredUsers.length === 0) {
      logger.info('No users to send notifications to after preference filtering');
      return [];
    }
    
    // Create notification data for each user
    const bulkData = filteredUsers.map(userId => ({
      ...notificationData,
      user_id: userId,
    }));
    
    // Create notifications in bulk
    const created = await Notification.bulkCreate(bulkData);
    logger.info(`Created ${created.length} bulk notifications`);
    
    // Process each notification for real-time, email, and push delivery
    const results = [];
    
    for (const notification of created) {
      // Track if this notification had errors
      let notificationResult = { id: notification.id, userId: notification.user_id, success: true };
      
      // Send real-time notification
      if (sendRealtime) {
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
          notificationResult.realtime = true;
        } catch (wsError) {
          logger.error(`Failed to send real-time notification #${notification.id}`, {
            error: wsError.message,
            userId: notification.user_id,
          });
          notificationResult.realtime = false;
          notificationResult.realtimeError = wsError.message;
          notificationResult.success = false;
        }
      }
      
      // Send email notification if enabled
      if (sendEmail) {
        try {
          // Check if user wants email notifications for this type
          const shouldSendEmail = await preferenceService.shouldSendNotification(
            notification.user_id,
            notification,
            'email'
          );
          
          if (shouldSendEmail) {
            await emailNotificationService.sendEmailNotification(notification, notification.user_id);
            notificationResult.email = true;
          } else {
            notificationResult.email = false;
            notificationResult.emailSkipped = true;
          }
        } catch (emailError) {
          logger.error(`Failed to send email for notification #${notification.id}`, {
            error: emailError.message,
            userId: notification.user_id,
          });
          notificationResult.email = false;
          notificationResult.emailError = emailError.message;
          notificationResult.success = false;
        }
      }
      
      // Send push notification if enabled
      if (sendPush) {
        try {
          // Check if user wants push notifications for this type
          const shouldSendPush = await preferenceService.shouldSendNotification(
            notification.user_id,
            notification,
            'push'
          );
          
          if (shouldSendPush) {
            await pushNotificationService.sendPushNotification(notification, notification.user_id);
            notificationResult.push = true;
          } else {
            notificationResult.push = false;
            notificationResult.pushSkipped = true;
          }
        } catch (pushError) {
          logger.error(`Failed to send push notification #${notification.id}`, {
            error: pushError.message,
            userId: notification.user_id,
          });
          notificationResult.push = false;
          notificationResult.pushError = pushError.message;
          notificationResult.success = false;
        }
      }
      
      results.push(notificationResult);
    }
    
    logger.info(`Processed ${results.length} bulk notifications`);
    return created;
  } catch (error) {
    logger.error('Error creating bulk notifications', {
      error: error.message,
      userCount: userIds.length,
      notificationType: notificationData.type,
    });
    throw error;
  }
};

/**
 * Schedule a notification to be sent in the future
 * @param {Object} notificationData - Notification data
 * @param {Date} scheduledTime - Time to deliver the notification
 * @returns {Object} Scheduled notification details
 */
const scheduleNotification = async (notificationData, scheduledTime) => {
  try {
    if (!(scheduledTime instanceof Date) || isNaN(scheduledTime.getTime())) {
      throw new Error('Invalid scheduled time: must be a valid Date object');
    }
    
    // Ensure scheduled time is in the future
    const now = new Date();
    if (scheduledTime <= now) {
      logger.warn('Scheduled time is in the past, will be sent immediately');
    }
    
    // Prepare metadata with scheduling information
    const metadata = {
      ...(notificationData.metadata || {}),
      scheduled: true,
      scheduledTime: scheduledTime.toISOString(),
      createdAt: now.toISOString()
    };
    
    // Create notification with scheduled status
    const notification = await Notification.create({
      ...notificationData,
      metadata,
      status: 'scheduled',
      read: false
    });
    
    logger.info(`Created scheduled notification #${notification.id} for user ${notification.user_id} at ${scheduledTime.toISOString()}`);
    
    // If the scheduled time is in the past or very near future, process it immediately
    if (scheduledTime <= new Date(now.getTime() + 1000)) { // If scheduled within 1 second
      await processScheduledNotification(notification.id);
      logger.info(`Immediately processed scheduled notification #${notification.id}`);
      return notification;
    }
    
    // In production, this would be handled by the cron job
    // For development/testing, we can use setTimeout as a fallback
    if (process.env.NODE_ENV !== 'production') {
      const delay = scheduledTime.getTime() - now.getTime();
      setTimeout(() => {
        processScheduledNotification(notification.id).catch(error => {
          logger.error(`Error processing scheduled notification ${notification.id}`, {
            error: error.message,
          });
        });
      }, delay);
      logger.info(`Set timeout to process notification #${notification.id} in ${delay}ms`);
    }
    
    return notification;
  } catch (error) {
    logger.error('Error scheduling notification', {
      error: error.message,
      scheduledTime: scheduledTime?.toISOString(),
      userData: notificationData,
    });
    throw error;
  }
};

/**
 * Process a scheduled notification
 * @param {Number} notificationId - Notification ID
 * @returns {Object} Processed notification
 */
const processScheduledNotification = async (notificationId) => {
  try {
    // Get notification
    const notification = await Notification.findByPk(notificationId);
    
    if (!notification) {
      throw new Error('Scheduled notification not found');
    }
    
    // Update status to reflect delivery
    notification.status = 'unread';
    
    // Update metadata to reflect delivery
    const metadata = notification.metadata || {};
    metadata.scheduled = false;
    metadata.delivered = true;
    metadata.deliveredAt = new Date().toISOString();
    notification.metadata = metadata;
    
    await notification.save();
    
    // Send real-time notification
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
    } catch (wsError) {
      logger.error('Failed to send scheduled real-time notification', {
        error: wsError.message,
        notificationId: notification.id,
      });
    }
    
    // Send email notification if user has email preferences enabled
    try {
      const shouldSendEmail = await preferenceService.shouldSendNotification(
        notification.user_id, 
        notification, 
        'email'
      );
      
      if (shouldSendEmail) {
        await emailNotificationService.sendEmailNotification(notification, notification.user_id);
        logger.info(`Sent scheduled email notification to user ${notification.user_id}`);
      } else {
        logger.info(`Skipped email notification for user ${notification.user_id} based on preferences`);
      }
    } catch (emailError) {
      logger.error('Failed to send scheduled email notification', {
        error: emailError.message,
        notificationId: notification.id,
      });
    }
    
    // Send push notification if user has push preferences enabled
    try {
      const shouldSendPush = await preferenceService.shouldSendNotification(
        notification.user_id, 
        notification, 
        'push'
      );
      
      if (shouldSendPush) {
        await pushNotificationService.sendScheduledPushNotification(notification);
        logger.info(`Sent scheduled push notification to user ${notification.user_id}`);
      } else {
        logger.info(`Skipped push notification for user ${notification.user_id} based on preferences`);
      }
    } catch (pushError) {
      logger.error('Failed to send scheduled push notification', {
        error: pushError.message,
        notificationId: notification.id,
      });
    }
    
    return notification;
  } catch (error) {
    logger.error('Error processing scheduled notification', {
      error: error.message,
      notificationId,
    });
    throw error;
  }
};

/**
 * Send daily email digests to all users with that preference
 */
const sendDailyDigests = async () => {
  try {
    const result = await emailService.sendEmailDigests('daily');
    return result;
  } catch (error) {
    logger.error('Error sending daily digests', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Send weekly email digests to all users with that preference
 */
const sendWeeklyDigests = async () => {
  try {
    const result = await emailService.sendEmailDigests('weekly');
    return result;
  } catch (error) {
    logger.error('Error sending weekly digests', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Process scheduled notifications that are due
 * @returns {Promise<Object>} Result of processing
 */
async function processScheduledNotifications() {
  const now = new Date();
  try {
    logger.info('Processing scheduled notifications');
    
    // Find notifications that are scheduled and due
    const scheduledNotifications = await Notification.findAll({
      where: {
        metadata: {
          [Op.and]: [
            sequelize.literal("JSON_EXTRACT(metadata, '$.scheduled') = true"),
            sequelize.literal(`JSON_EXTRACT(metadata, '$.scheduledTime') <= '${now.toISOString()}'`),
            sequelize.literal("JSON_EXTRACT(metadata, '$.processed') IS NULL")
          ]
        }
      }
    });
    
    logger.info(`Found ${scheduledNotifications.length} scheduled notifications to process`);
    
    const results = {
      processed: 0,
      failed: 0,
      details: []
    };
    
    for (const notification of scheduledNotifications) {
      try {
        await processSingleScheduledNotification(notification);
        results.processed += 1;
        results.details.push({
          id: notification.id,
          status: 'processed',
          message: 'Successfully processed'
        });
      } catch (error) {
        logger.error(`Error processing scheduled notification ${notification.id}:`, error);
        results.failed += 1;
        results.details.push({
          id: notification.id,
          status: 'failed',
          message: error.message
        });
      }
    }
    
    logger.info(`Processed ${results.processed} scheduled notifications, ${results.failed} failed`);
    return results;
  } catch (error) {
    logger.error('Error processing scheduled notifications:', error);
    throw error;
  }
}

/**
 * Process a single scheduled notification
 * @param {Object} notification The notification to process
 * @returns {Promise<void>}
 */
async function processSingleScheduledNotification(notification) {
  try {
    logger.info(`Processing scheduled notification ${notification.id}`);
    
    // Update the notification metadata to mark as processed
    const metadata = notification.metadata || {};
    metadata.processed = true;
    metadata.processedAt = new Date().toISOString();
    
    await notification.update({ 
      metadata,
      status: 'SENT' 
    });
    
    // Get the user to check preferences
    const user = await User.findByPk(notification.userId);
    if (!user) {
      throw new Error(`User ${notification.userId} not found`);
    }
    
    // Check if user wants to receive email notifications
    const emailPreference = await preferenceService.getUserPreference(user.id, 'email_notifications');
    if (emailPreference && emailPreference.value === true) {
      // Send email notification
      await emailNotificationService.sendNotificationEmail(user.email, {
        subject: notification.title,
        content: notification.message,
        metadata: notification.metadata
      });
      logger.info(`Sent email notification to ${user.email}`);
    }
    
    logger.info(`Successfully processed scheduled notification ${notification.id}`);
  } catch (error) {
    logger.error(`Error processing scheduled notification ${notification.id}:`, error);
    throw error;
  }
}

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createBulkNotifications,
  scheduleNotification,
  processScheduledNotification,
  processSingleScheduledNotification,
  sendDailyDigests,
  sendWeeklyDigests,
  processScheduledNotifications,
}; 