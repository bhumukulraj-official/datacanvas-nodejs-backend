const cron = require('node-cron');
const notificationService = require('../../notifications/services/notification.service');
const logger = require('../../../shared/utils/logger');

/**
 * Daily digest job - runs at 8:00 AM every day
 * Sends notification digests to users who have opted for daily digests
 */
const dailyDigestJob = {
  name: 'dailyNotificationDigest',
  schedule: '0 8 * * *', // At 8:00 AM every day
  handler: async () => {
    try {
      logger.info('Starting daily notification digest job');
      const digestsSent = await notificationService.sendDailyDigests();
      logger.info(`Daily notification digest job completed - sent ${digestsSent} digests`);
      return digestsSent;
    } catch (error) {
      logger.error(`Error in daily notification digest job: ${error.message}`, { error });
      throw error;
    }
  }
};

/**
 * Weekly digest job - runs at 9:00 AM every Monday
 * Sends notification digests to users who have opted for weekly digests
 */
const weeklyDigestJob = {
  name: 'weeklyNotificationDigest',
  schedule: '0 9 * * 1', // At 9:00 AM every Monday
  handler: async () => {
    try {
      logger.info('Starting weekly notification digest job');
      const digestsSent = await notificationService.sendWeeklyDigests();
      logger.info(`Weekly notification digest job completed - sent ${digestsSent} digests`);
      return digestsSent;
    } catch (error) {
      logger.error(`Error in weekly notification digest job: ${error.message}`, { error });
      throw error;
    }
  }
};

module.exports = {
  dailyDigestJob,
  weeklyDigestJob
}; 