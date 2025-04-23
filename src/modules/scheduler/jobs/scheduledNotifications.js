const notificationService = require('../../notifications/services/notification.service');
const logger = require('../../../shared/utils/logger');

/**
 * Scheduled notifications job - runs every 5 minutes
 * Processes scheduled notifications that are due to be sent
 */
const scheduledNotificationsJob = {
  name: 'processScheduledNotifications',
  schedule: '*/5 * * * *', // Every 5 minutes
  handler: async () => {
    try {
      logger.info('Processing scheduled notifications...');
      const result = await notificationService.processScheduledNotifications();
      logger.info(`Processed ${result.count} scheduled notifications`);
      return result;
    } catch (error) {
      logger.error(`Error in scheduled notifications job: ${error.message}`, { error });
      throw error;
    }
  }
};

module.exports = scheduledNotificationsJob; 