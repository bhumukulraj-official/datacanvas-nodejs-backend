const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../../shared/database');

/**
 * NotificationPreference model
 * This is a virtual model that doesn't have its own table
 * but uses the metadata field in the User model to store preferences
 */
class NotificationPreference extends Model {
  /**
   * Get default preferences for a new user
   * @returns {Object} Default preferences
   */
  static getDefaultPreferences() {
    return {
      emailNotifications: {
        enabled: true,
        digest: {
          enabled: false,
          frequency: 'daily', // 'daily', 'weekly'
        },
      },
      pushNotifications: {
        enabled: false,
        browser: true,
        mobile: false,
      },
      categories: {
        system: {
          enabled: true,
          email: true,
          push: true,
        },
        security: {
          enabled: true,
          email: true,
          push: true,
        },
        content: {
          enabled: true,
          email: false,
          push: true,
        },
        account: {
          enabled: true,
          email: true,
          push: true,
        },
        project: {
          enabled: true,
          email: false,
          push: true,
        },
        billing: {
          enabled: true,
          email: true,
          push: true,
        },
        social: {
          enabled: true,
          email: false,
          push: true,
        },
      },
    };
  }

  /**
   * Check if a notification should be sent based on the user's preferences
   * @param {Object} user - User object
   * @param {Object} notification - Notification object
   * @param {String} channel - Notification channel (email, push)
   * @returns {Boolean} Whether the notification should be sent
   */
  static shouldSendNotification(user, notification, channel) {
    if (!user || !notification || !channel) {
      return false;
    }
    
    // Get user preferences
    const preferences = this.getUserPreferences(user);
    
    // Check if the channel is enabled globally
    if (channel === 'email' && !preferences.emailNotifications.enabled) {
      return false;
    }
    
    if (channel === 'push' && !preferences.pushNotifications.enabled) {
      return false;
    }
    
    // Check if the category is enabled
    const category = notification.type || 'system';
    if (!preferences.categories[category]?.enabled) {
      return false;
    }
    
    // Check if the channel is enabled for this category
    return preferences.categories[category]?.[channel] || false;
  }
  
  /**
   * Get user preferences
   * @param {Object} user - User object
   * @returns {Object} User preferences
   */
  static getUserPreferences(user) {
    if (!user) {
      return this.getDefaultPreferences();
    }
    
    // If user has no notification preferences, return defaults
    if (!user.metadata || !user.metadata.notificationPreferences) {
      return this.getDefaultPreferences();
    }
    
    // Merge user preferences with defaults to ensure all fields exist
    return {
      ...this.getDefaultPreferences(),
      ...user.metadata.notificationPreferences,
    };
  }
  
  /**
   * Update user preferences
   * @param {Object} user - User object
   * @param {Object} preferences - New preferences
   * @returns {Object} Updated user object
   */
  static async updateUserPreferences(user, preferences) {
    if (!user) {
      throw new Error('User is required');
    }
    
    // Get current metadata
    const metadata = user.metadata || {};
    
    // Update notification preferences
    metadata.notificationPreferences = {
      ...this.getUserPreferences(user),
      ...preferences,
    };
    
    // Update user metadata
    user.metadata = metadata;
    await user.save();
    
    return user;
  }
}

module.exports = NotificationPreference; 