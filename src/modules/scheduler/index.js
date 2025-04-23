const publishScheduledPostsJob = require('./jobs/publishScheduledPosts');
const logger = require('../../shared/utils/logger');

/**
 * Initialize all scheduled jobs
 */
const initScheduler = () => {
  // Start the publish scheduled posts job
  publishScheduledPostsJob.start();
  logger.info('Publish scheduled posts job started');
  
  // Add other jobs here
};

module.exports = {
  initScheduler
}; 