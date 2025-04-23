const { CronJob } = require('cron');
const blogService = require('../../blog/services/blog.service');
const logger = require('../../../shared/utils/logger');

/**
 * Job to automatically publish scheduled blog posts
 * Runs every 15 minutes
 */
const job = new CronJob(
  '*/15 * * * *', // Every 15 minutes
  async function() {
    try {
      logger.info('Running scheduled post publishing job');
      const result = await blogService.publishScheduledPosts();
      
      if (result.count > 0) {
        logger.info(`Published ${result.count} scheduled posts: ${JSON.stringify(result.published)}`);
      } else {
        logger.info('No scheduled posts ready for publishing');
      }
    } catch (error) {
      logger.error(`Error in scheduled post publishing job: ${error.message}`, { error });
    }
  },
  null, // onComplete
  false, // start
  'UTC' // timezone
);

module.exports = job; 