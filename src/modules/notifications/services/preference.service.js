const NotificationPreference = require('../models/NotificationPreference');
const User = require('../../auth/models/User');
const logger = require('../../../shared/utils/logger');

/**
 * Get notification preferences for a user
 * @param {Number} userId - User ID
 * @returns {Object} User notification preferences
 */
const getUserPreferences = async (userId) => {
  try {
    // Get user with metadata
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Get preferences from user metadata
    return NotificationPreference.getUserPreferences(user);
  } catch (error) {
    logger.error('Error getting user notification preferences', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Update notification preferences for a user
 * @param {Number} userId - User ID
 * @param {Object} preferences - New preferences
 * @returns {Object} Updated preferences
 */
const updateUserPreferences = async (userId, preferences) => {
  try {
    // Get user with metadata
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Update preferences
    await NotificationPreference.updateUserPreferences(user, preferences);
    
    // Get updated preferences
    return NotificationPreference.getUserPreferences(user);
  } catch (error) {
    logger.error('Error updating user notification preferences', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Check if a notification should be sent to a user via a specific channel
 * @param {Number} userId - User ID
 * @param {Object} notification - Notification object
 * @param {String} channel - Notification channel (email, push)
 * @returns {Boolean} Whether the notification should be sent
 */
const shouldSendNotification = async (userId, notification, channel) => {
  try {
    // Get user with metadata
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Check if notification should be sent
    return NotificationPreference.shouldSendNotification(user, notification, channel);
  } catch (error) {
    logger.error('Error checking if notification should be sent', {
      error: error.message,
      userId,
      notificationType: notification?.type,
      channel,
    });
    
    // Default to true in case of error
    return true;
  }
};

/**
 * Reset user preferences to defaults
 * @param {Number} userId - User ID
 * @returns {Object} Default preferences
 */
const resetUserPreferences = async (userId) => {
  try {
    // Get user with metadata
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Get default preferences
    const defaultPreferences = NotificationPreference.getDefaultPreferences();
    
    // Update user preferences to defaults
    const metadata = user.metadata || {};
    metadata.notificationPreferences = defaultPreferences;
    user.metadata = metadata;
    await user.save();
    
    return defaultPreferences;
  } catch (error) {
    logger.error('Error resetting user notification preferences', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

module.exports = {
  getUserPreferences,
  updateUserPreferences,
  shouldSendNotification,
  resetUserPreferences,
}; 