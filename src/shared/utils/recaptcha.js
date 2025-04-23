const axios = require('axios');
const logger = require('./logger');

/**
 * Validates a reCAPTCHA token
 * @param {string} token - The reCAPTCHA token to validate
 * @returns {Promise<boolean>} - Whether the token is valid
 */
exports.validateRecaptcha = async (token) => {
  if (!token) {
    logger.warn('No reCAPTCHA token provided');
    return false;
  }

  try {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    
    if (!secretKey) {
      logger.error('reCAPTCHA secret key is not configured');
      // Return true in development if no key is set
      return process.env.NODE_ENV === 'development';
    }

    const url = 'https://www.google.com/recaptcha/api/siteverify';
    
    const response = await axios.post(
      url,
      null,
      {
        params: {
          secret: secretKey,
          response: token
        }
      }
    );

    const { success, score } = response.data;
    
    // Log score for analysis and debugging
    logger.debug('reCAPTCHA validation', { success, score });
    
    // If v3 reCAPTCHA, check score threshold
    if (score !== undefined) {
      const threshold = parseFloat(process.env.RECAPTCHA_SCORE_THRESHOLD || '0.5');
      return success && score >= threshold;
    }
    
    return success;
  } catch (error) {
    logger.error('reCAPTCHA validation error', { error: error.message });
    // Fail open in development, fail closed in production
    return process.env.NODE_ENV === 'development';
  }
}; 