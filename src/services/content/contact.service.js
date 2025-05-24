const { ContactSubmissionRepository } = require('../../data/repositories/public_api');
const { transporter } = require('../../config/email');
const { CustomError } = require('../../utils/error.util');
const logger = require('../../utils/logger.util');

class ContactService {
  constructor() {
    this.contactSubmissionRepository = ContactSubmissionRepository;
  }

  /**
   * Submit a contact form
   * @param {Object} data - Contact form data
   * @param {string} data.name - Contact name
   * @param {string} data.email - Contact email
   * @param {string} data.subject - Contact subject
   * @param {string} data.message - Contact message
   * @param {string} ipAddress - IP address of the request
   * @param {string} userAgent - User agent of the request
   * @param {number} recaptchaScore - Google reCAPTCHA score (if enabled)
   * @returns {Promise<Object>} Created contact submission
   */
  async submitContactForm(data, ipAddress, userAgent, recaptchaScore = null) {
    try {
      // Create contact submission record
      const submission = await this.contactSubmissionRepository.create({
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
        ip_address: ipAddress,
        user_agent: userAgent,
        recaptcha_score: recaptchaScore,
        status: 'pending'
      });

      // Send notification email to admin
      await this._sendAdminNotification(submission);
      
      // Send confirmation email to the contact
      await this._sendConfirmationEmail(submission);

      return submission;
    } catch (error) {
      logger.error('Error submitting contact form', { error: error.message, data });
      throw error;
    }
  }

  /**
   * Send notification email to administrator
   * @param {Object} submission - Contact submission data
   * @private
   */
  async _sendAdminNotification(submission) {
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
      
      await transporter.sendMail({
        to: adminEmail,
        subject: `New Contact Form Submission: ${submission.subject}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${submission.name}</p>
          <p><strong>Email:</strong> ${submission.email}</p>
          <p><strong>Subject:</strong> ${submission.subject}</p>
          <p><strong>Message:</strong></p>
          <p>${submission.message.replace(/\n/g, '<br>')}</p>
          <p><strong>IP Address:</strong> ${submission.ip_address}</p>
          <p><strong>Submitted at:</strong> ${new Date(submission.created_at).toLocaleString()}</p>
        `
      });
      
      logger.info('Admin notification email sent', { submission_id: submission.id });
    } catch (error) {
      logger.error('Failed to send admin notification', { error: error.message, submission_id: submission.id });
      // We don't throw here to not affect the main flow if notification fails
    }
  }

  /**
   * Send confirmation email to contact
   * @param {Object} submission - Contact submission data
   * @private
   */
  async _sendConfirmationEmail(submission) {
    try {
      await transporter.sendMail({
        to: submission.email,
        subject: 'Thank you for your message',
        html: `
          <h2>Thank you for your message</h2>
          <p>Dear ${submission.name},</p>
          <p>We have received your message regarding "${submission.subject}" and will get back to you as soon as possible.</p>
          <p>This is an automated response to confirm we've received your inquiry.</p>
          <p>Best regards,<br>The Portfolio Team</p>
        `
      });
      
      logger.info('Confirmation email sent', { submission_id: submission.id });
    } catch (error) {
      logger.error('Failed to send confirmation email', { error: error.message, submission_id: submission.id });
      // We don't throw here to not affect the main flow if confirmation fails
    }
  }
}

module.exports = new ContactService(); 