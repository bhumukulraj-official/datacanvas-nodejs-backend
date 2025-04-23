const User = require('../../auth/models/User');
const emailService = require('../../../shared/services/email.service');
const templateService = require('./template.service');
const preferenceService = require('./preference.service');
const logger = require('../../../shared/utils/logger');

/**
 * Send email notification to a user
 * @param {Object} notification - Notification object
 * @param {Number} userId - User ID
 * @returns {Promise<Object>} Email send result
 */
const sendEmailNotification = async (notification, userId) => {
  try {
    // Get user data
    const user = await User.findByPk(userId);
    
    if (!user || !user.email) {
      throw new Error('User not found or has no email address');
    }
    
    // Check if the user wants to receive this notification by email
    const shouldSend = await preferenceService.shouldSendNotification(userId, notification, 'email');
    if (!shouldSend) {
      logger.info('Email notification skipped due to user preferences', { userId, notificationId: notification.id });
      return { skipped: true, reason: 'user_preference' };
    }
    
    // Format notification for email
    const emailContent = templateService.formatNotification(notification, 'email');
    
    // Send email
    const result = await emailService.sendEmail({
      to: user.email,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
    });
    
    logger.info('Email notification sent', { userId, notificationId: notification.id, messageId: result.messageId });
    
    return { sent: true, messageId: result.messageId };
  } catch (error) {
    logger.error('Failed to send email notification', {
      error: error.message,
      userId,
      notificationId: notification.id,
    });
    
    throw error;
  }
};

/**
 * Send email digests for all users with digest enabled
 * @param {String} frequency - Digest frequency ('daily', 'weekly')
 * @returns {Promise<Object>} Results of digest sending
 */
const sendEmailDigests = async (frequency = 'daily') => {
  try {
    // Get all users with email digests enabled
    const users = await User.findAll();
    const results = { sent: 0, failed: 0, skipped: 0 };
    const processedUsers = [];
    
    // Process each user
    for (const user of users) {
      try {
        // Check if user has email digest enabled for the specified frequency
        const preferences = await preferenceService.getUserPreferences(user.id);
        const digestEnabled = preferences.emailNotifications.enabled && 
                             preferences.emailNotifications.digest.enabled && 
                             preferences.emailNotifications.digest.frequency === frequency;
        
        if (!digestEnabled) {
          results.skipped++;
          continue;
        }
        
        // Get unread notifications for user within the appropriate time frame
        const timeFrame = frequency === 'daily' ? '24 hours' : '7 days';
        const { Notification } = require('../models/Notification');
        const { Op } = require('sequelize');
        
        const notifications = await Notification.findAll({
          where: {
            user_id: user.id,
            read: false,
            created_at: {
              [Op.gte]: new Date(Date.now() - (frequency === 'daily' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000))
            }
          },
          order: [['created_at', 'DESC']]
        });
        
        if (notifications.length === 0) {
          results.skipped++;
          continue;
        }
        
        // Generate digest email
        const digestHtml = generateDigestHtml(notifications, frequency);
        const digestText = generateDigestText(notifications, frequency);
        
        // Send digest email
        await emailService.sendEmail({
          to: user.email,
          subject: `Your ${frequency} DataCanvas notification digest`,
          text: digestText,
          html: digestHtml,
        });
        
        results.sent++;
        processedUsers.push(user.id);
      } catch (error) {
        logger.error('Error sending digest for user', {
          error: error.message,
          userId: user.id,
          frequency,
        });
        results.failed++;
      }
    }
    
    logger.info('Finished sending notification digests', {
      frequency,
      results,
      processedUsers,
    });
    
    return results;
  } catch (error) {
    logger.error('Failed to send email digests', {
      error: error.message,
      frequency,
    });
    
    throw error;
  }
};

/**
 * Generate HTML for digest email
 * @param {Array} notifications - Array of notification objects
 * @param {String} frequency - Digest frequency ('daily', 'weekly')
 * @returns {String} HTML content
 */
const generateDigestHtml = (notifications, frequency) => {
  const title = `Your ${frequency} notification digest`;
  const timeFrame = frequency === 'daily' ? 'today' : 'this week';
  
  let notificationsHtml = '';
  
  // Generate HTML for each notification
  notifications.forEach(notification => {
    const typeColor = getTypeColor(notification.type);
    const date = new Date(notification.created_at).toLocaleString();
    
    notificationsHtml += `
      <div style="margin-bottom: 20px; border-left: 4px solid ${typeColor}; padding-left: 15px;">
        <h3 style="margin: 0 0 5px 0; color: #333;">${notification.title}</h3>
        <p style="margin: 0 0 5px 0;">${notification.message}</p>
        <p style="margin: 0; font-size: 12px; color: #777;">
          ${capitalizeFirstLetter(notification.type)} • ${date}
        </p>
      </div>
    `;
  });
  
  // Generate full HTML email
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; border-bottom: 3px solid #007bff;">
        <h1 style="color: #007bff; margin: 0;">${title}</h1>
        <p style="margin: 10px 0 0 0;">Here are your notifications from ${timeFrame}.</p>
      </div>
      <div style="padding: 20px;">
        ${notificationsHtml}
        <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #777;">
          You are receiving this digest because you've enabled ${frequency} email digests in your notification preferences.
          <br>
          <a href="${process.env.APP_URL}/settings/notifications" style="color: #007bff;">Update your notification preferences</a>
        </p>
      </div>
    </div>
  `;
};

/**
 * Generate plain text for digest email
 * @param {Array} notifications - Array of notification objects
 * @param {String} frequency - Digest frequency ('daily', 'weekly')
 * @returns {String} Plain text content
 */
const generateDigestText = (notifications, frequency) => {
  const title = `Your ${frequency} notification digest`;
  const timeFrame = frequency === 'daily' ? 'today' : 'this week';
  
  let notificationsText = '';
  
  // Generate text for each notification
  notifications.forEach(notification => {
    const date = new Date(notification.created_at).toLocaleString();
    
    notificationsText += `
${notification.title}
${notification.message}
${capitalizeFirstLetter(notification.type)} • ${date}

`;
  });
  
  // Generate full text email
  return `${title}

Here are your notifications from ${timeFrame}.

${notificationsText}

You are receiving this digest because you've enabled ${frequency} email digests in your notification preferences.
Update your notification preferences: ${process.env.APP_URL}/settings/notifications
`;
};

/**
 * Get color for notification type
 * @param {String} type - Notification type
 * @returns {String} Color hex code
 */
const getTypeColor = (type) => {
  const colors = {
    system: '#007bff',
    security: '#dc3545',
    content: '#6f42c1',
    account: '#17a2b8',
    project: '#28a745',
    billing: '#ffc107',
    social: '#fd7e14',
    user: '#6c757d',
  };
  
  return colors[type] || colors.system;
};

/**
 * Capitalize the first letter of a string
 * @param {String} string - Input string
 * @returns {String} Capitalized string
 */
const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

module.exports = {
  sendEmailNotification,
  sendEmailDigests,
}; 