const cron = require('node-cron');
const logger = require('../../shared/utils/logger');
const scheduledNotificationsJob = require('./jobs/scheduledNotifications');
const { dailyDigestJob, weeklyDigestJob } = require('./jobs/notificationDigests');
const publishScheduledPostsJob = require('./jobs/publishScheduledPosts');
const { schedulerRoutes } = require('./routes');

// Collection to store all registered jobs
const registeredJobs = new Map();

/**
 * Register a scheduled job
 * @param {Object} job - Job configuration object
 * @param {string} job.name - Unique name for the job
 * @param {string} job.schedule - Cron schedule expression
 * @param {Function} job.handler - Async function to execute
 */
function registerJob(job) {
  if (registeredJobs.has(job.name)) {
    logger.warn(`Job '${job.name}' is already registered. Skipping registration.`);
    return;
  }

  try {
    const task = cron.schedule(job.schedule, async () => {
      try {
        logger.info(`Executing scheduled job: ${job.name}`);
        await job.handler();
      } catch (error) {
        logger.error(`Error executing job '${job.name}': ${error.message}`, { error });
      }
    }, {
      scheduled: false
    });

    registeredJobs.set(job.name, task);
    logger.info(`Job '${job.name}' registered successfully with schedule: ${job.schedule}`);
  } catch (error) {
    logger.error(`Failed to register job '${job.name}': ${error.message}`, { error });
  }
}

/**
 * Start a registered job
 * @param {string} jobName - Name of the job to start
 */
function startJob(jobName) {
  const job = registeredJobs.get(jobName);
  
  if (!job) {
    logger.error(`Cannot start job '${jobName}': Job not found`);
    return;
  }
  
  try {
    job.start();
    logger.info(`Job '${jobName}' started successfully`);
  } catch (error) {
    logger.error(`Failed to start job '${jobName}': ${error.message}`, { error });
  }
}

/**
 * Stop a registered job
 * @param {string} jobName - Name of the job to stop
 */
function stopJob(jobName) {
  const job = registeredJobs.get(jobName);
  
  if (!job) {
    logger.error(`Cannot stop job '${jobName}': Job not found`);
    return;
  }
  
  try {
    job.stop();
    logger.info(`Job '${jobName}' stopped successfully`);
  } catch (error) {
    logger.error(`Failed to stop job '${jobName}': ${error.message}`, { error });
  }
}

/**
 * Initialize all scheduler jobs
 */
function initializeScheduler() {
  logger.info('Initializing scheduler jobs...');
  
  // Convert legacy job to new format if needed
  if (typeof publishScheduledPostsJob.handler !== 'function') {
    const legacyJob = {
      name: 'publishScheduledPosts',
      schedule: publishScheduledPostsJob._cronTime.source,
      handler: publishScheduledPostsJob._callback
    };
    registerJob(legacyJob);
  } else {
    registerJob(publishScheduledPostsJob);
  }
  
  // Register notification jobs
  registerJob(scheduledNotificationsJob);
  registerJob(dailyDigestJob);
  registerJob(weeklyDigestJob);
  
  // Start all registered jobs
  registeredJobs.forEach((_, jobName) => {
    startJob(jobName);
  });
  
  logger.info('Scheduler initialized successfully');
}

module.exports = {
  registerJob,
  startJob,
  stopJob,
  initializeScheduler,
  schedulerRoutes
}; 