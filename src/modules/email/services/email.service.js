/**
 * Email service for sending emails and digests
 */
const logger = require('../../../shared/utils/logger');

/**
 * Send email digests to users based on frequency preference
 * @param {String} frequency - Digest frequency ('daily' or 'weekly')
 * @returns {Object} Results of sending
 */
const sendEmailDigests = async (frequency) => {
  try {
    logger.info(`Mock: Sending ${frequency} email digests`);
    return {
      success: true,
      sent: 0,
      message: `Mock ${frequency} digest service - no emails actually sent`
    };
  } catch (error) {
    logger.error(`Error sending ${frequency} email digests:`, error);
    throw error;
  }
};

/**
 * Send an email notification
 * @param {String} recipient - Email address to send to
 * @param {Object} options - Email options
 * @returns {Boolean} Success status
 */
const sendEmail = async (recipient, options) => {
  try {
    logger.info(`Mock: Sending email to ${recipient}`, { subject: options.subject });
    return true;
  } catch (error) {
    logger.error('Error sending email:', error);
    throw error;
  }
};

module.exports = {
  sendEmailDigests,
  sendEmail
}; 