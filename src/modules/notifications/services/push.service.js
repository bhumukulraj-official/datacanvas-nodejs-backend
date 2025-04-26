const webpush = require('web-push');
const logger = require('../../../shared/utils/logger');
const PushSubscription = require('../models/PushSubscription');
const preferenceService = require('./preference.service');
const templateService = require('./template.service');

// Flag to indicate if push notifications are enabled
let pushNotificationsEnabled = false;

// Configure web-push with VAPID keys if available
try {
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:notifications@datacanvas.io';
  
  if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(
      vapidSubject,
      vapidPublicKey,
      vapidPrivateKey
    );
    pushNotificationsEnabled = true;
    logger.info('Push notifications enabled with VAPID keys');
  } else {
    logger.warn('Push notifications disabled: VAPID keys not provided in environment variables');
  }
} catch (error) {
  logger.error('Failed to configure push notifications:', error);
}

/**
 * Save a new push subscription for a user
 * @param {Number} userId - User ID
 * @param {Object} subscription - Push subscription object from browser
 * @param {Object} deviceInfo - Additional device information
 * @returns {Object} Saved subscription
 */
const saveSubscription = async (userId, subscription, deviceInfo = {}) => {
  try {
    if (!userId || !subscription || !subscription.endpoint) {
      throw new Error('Invalid subscription data');
    }

    // Check if subscription already exists
    const existingSubscription = await PushSubscription.findOne({
      where: { endpoint: subscription.endpoint }
    });

    if (existingSubscription) {
      // Update existing subscription
      await existingSubscription.update({
        user_id: userId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        user_agent: deviceInfo.userAgent,
        device_type: deviceInfo.deviceType || 'browser',
        is_active: true,
        metadata: {
          ...existingSubscription.metadata,
          ...deviceInfo.metadata,
          last_updated: new Date().toISOString()
        }
      });

      logger.info(`Updated push subscription for user ${userId}`);
      return existingSubscription;
    }

    // Create new subscription
    const newSubscription = await PushSubscription.create({
      user_id: userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      user_agent: deviceInfo.userAgent,
      device_type: deviceInfo.deviceType || 'browser',
      metadata: {
        ...deviceInfo.metadata,
        created_at: new Date().toISOString()
      }
    });

    logger.info(`Created new push subscription for user ${userId}`);
    return newSubscription;
  } catch (error) {
    logger.error('Error saving push subscription', {
      error: error.message,
      userId
    });
    throw error;
  }
};

/**
 * Delete a push subscription
 * @param {String} endpoint - Subscription endpoint
 * @returns {Boolean} Success status
 */
const deleteSubscription = async (endpoint) => {
  try {
    const result = await PushSubscription.destroy({
      where: { endpoint }
    });

    return result > 0;
  } catch (error) {
    logger.error('Error deleting push subscription', {
      error: error.message,
      endpoint
    });
    throw error;
  }
};

/**
 * Send push notification to a user
 * @param {Object} notification - Notification object
 * @param {Number} userId - User ID
 * @returns {Promise<Object>} Push notification results
 */
const sendPushNotification = async (notification, userId) => {
  try {
    // Check if push notifications are enabled
    if (!pushNotificationsEnabled) {
      logger.info('Push notification skipped: feature disabled (VAPID keys not configured)', { 
        userId, 
        notificationId: notification.id 
      });
      return { skipped: true, reason: 'feature_disabled' };
    }

    // Check if user wants to receive push notifications
    const shouldSend = await preferenceService.shouldSendNotification(userId, notification, 'push');
    if (!shouldSend) {
      logger.info('Push notification skipped due to user preferences', { userId, notificationId: notification.id });
      return { skipped: true, reason: 'user_preference' };
    }

    // Get user's subscriptions
    const subscriptions = await PushSubscription.findAll({
      where: {
        user_id: userId,
        is_active: true
      }
    });

    if (!subscriptions || subscriptions.length === 0) {
      logger.info('No active push subscriptions found for user', { userId });
      return { skipped: true, reason: 'no_subscriptions' };
    }

    // Format notification for push
    const pushContent = templateService.formatNotification(notification, 'push');
    
    // Prepare payload
    const payload = JSON.stringify({
      title: pushContent.title || notification.title,
      body: pushContent.body || notification.message,
      icon: pushContent.icon || '/icon-192x192.png',
      badge: pushContent.badge || '/badge.png',
      data: {
        url: pushContent.url || '/',
        notificationId: notification.id,
        timestamp: new Date().toISOString(),
        ...notification.metadata
      }
    });

    // Track results
    const results = {
      total: subscriptions.length,
      sent: 0,
      failed: 0,
      details: []
    };

    // Send to all subscriptions
    for (const subscription of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth
          }
        };

        const result = await webpush.sendNotification(pushSubscription, payload);
        
        results.sent++;
        results.details.push({
          subscriptionId: subscription.id,
          status: 'success',
          statusCode: result.statusCode
        });

        logger.debug('Push notification sent', {
          userId,
          notificationId: notification.id,
          subscriptionId: subscription.id
        });
      } catch (error) {
        results.failed++;
        
        // Handle expired or invalid subscriptions
        if (error.statusCode === 404 || error.statusCode === 410) {
          logger.info('Push subscription expired or invalid, deactivating', {
            userId,
            subscriptionId: subscription.id,
            endpoint: subscription.endpoint
          });
          
          // Deactivate the subscription
          await subscription.update({ is_active: false });
        }

        results.details.push({
          subscriptionId: subscription.id,
          status: 'failed',
          error: error.message,
          statusCode: error.statusCode
        });

        logger.error('Failed to send push notification', {
          error: error.message,
          userId,
          notificationId: notification.id,
          subscriptionId: subscription.id
        });
      }
    }

    logger.info('Push notification processing complete', {
      userId,
      notificationId: notification.id,
      results: `${results.sent}/${results.total} sent`
    });

    return results;
  } catch (error) {
    logger.error('Failed to process push notifications', {
      error: error.message,
      userId,
      notificationId: notification?.id
    });
    
    throw error;
  }
};

/**
 * Send push notification for a scheduled notification
 * @param {Object} notification - Notification object
 * @returns {Promise<Object>} Results
 */
const sendScheduledPushNotification = async (notification) => {
  try {
    return await sendPushNotification(notification, notification.user_id);
  } catch (error) {
    logger.error('Failed to send scheduled push notification', {
      error: error.message,
      notificationId: notification.id
    });
    throw error;
  }
};

/**
 * Get all active subscriptions for a user
 * @param {Number} userId - User ID
 * @returns {Array} User's push subscriptions
 */
const getUserSubscriptions = async (userId) => {
  try {
    return await PushSubscription.findAll({
      where: {
        user_id: userId,
        is_active: true
      }
    });
  } catch (error) {
    logger.error('Error getting user push subscriptions', {
      error: error.message,
      userId
    });
    throw error;
  }
};

/**
 * Get the VAPID public key
 * @returns {String|null} VAPID public key or null if not available
 */
const getVapidPublicKey = () => {
  if (!pushNotificationsEnabled) {
    logger.info('VAPID public key requested but push notifications are disabled');
    return null;
  }
  return process.env.VAPID_PUBLIC_KEY;
};

module.exports = {
  saveSubscription,
  deleteSubscription,
  sendPushNotification,
  sendScheduledPushNotification,
  getUserSubscriptions,
  getVapidPublicKey
}; 