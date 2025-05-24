const { ContactService } = require('../../../services/content');
const logger = require('../../../utils/logger.util');

class ContactController {
  /**
   * Submit a contact form
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async submitContactForm(req, res, next) {
    try {
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];
      
      // Get reCAPTCHA score if available
      const recaptchaScore = req.body.recaptchaToken ? 
        await this._validateRecaptcha(req.body.recaptchaToken) : null;
        
      // Submit the contact form
      const submission = await ContactService.submitContactForm(
        req.body, 
        ipAddress, 
        userAgent,
        recaptchaScore
      );
      
      // Return a sanitized response (without internal IDs)
      res.status(201).json({
        success: true,
        message: 'Contact form submitted successfully',
        data: {
          id: submission.uuid,
          email: submission.email,
          submitted_at: submission.created_at
        }
      });
    } catch (error) {
      logger.error('Error in contact form submission', { 
        error: error.message,
        email: req.body.email
      });
      next(error);
    }
  }
  
  /**
   * Validate reCAPTCHA token
   * @param {string} token - reCAPTCHA token
   * @returns {Promise<number|null>} reCAPTCHA score or null if not enabled
   * @private
   */
  async _validateRecaptcha(token) {
    // This could be implemented if reCAPTCHA is required
    // For now, return null (not implemented)
    return null;
  }
}

module.exports = new ContactController(); 