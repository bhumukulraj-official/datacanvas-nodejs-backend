const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Verify connection configuration
    if (process.env.NODE_ENV === 'production') {
      this.transporter.verify((error) => {
        if (error) {
          logger.error('Email service connection error', { error });
        } else {
          logger.info('Email service ready');
        }
      });
    }
  }

  /**
   * Send email
   * @param {Object} options - Email options
   * @param {String} options.to - Recipient email
   * @param {String} options.subject - Email subject
   * @param {String} options.text - Plain text content
   * @param {String} options.html - HTML content
   * @param {String} options.from - Sender email (optional, defaults to default sender)
   * @returns {Promise} - Email send result
   */
  async sendEmail(options) {
    try {
      const { to, subject, text, html, from = process.env.EMAIL_FROM } = options;

      const mailOptions = {
        from,
        to,
        subject,
        text,
        html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info('Email sent', { messageId: info.messageId, to });
      return info;
    } catch (error) {
      logger.error('Failed to send email', { error });
      throw error;
    }
  }

  /**
   * Send contact form reply email
   * @param {Object} contactSubmission - Contact submission object
   * @param {String} replyMessage - Reply message
   * @returns {Promise} - Email send result
   */
  async sendContactReply(contactSubmission, replyMessage) {
    const subject = `Re: ${contactSubmission.subject}`;
    const to = contactSubmission.email;
    const html = `
      <div>
        <p>Dear ${contactSubmission.name},</p>
        <p>Thank you for reaching out to us. Here is our response to your inquiry:</p>
        <div style="padding: 15px; border-left: 4px solid #ccc; margin: 10px 0;">
          ${replyMessage.replace(/\n/g, '<br>')}
        </div>
        <p>For your reference, your original message was:</p>
        <div style="padding: 15px; background-color: #f5f5f5; margin: 10px 0;">
          <strong>Subject:</strong> ${contactSubmission.subject}<br>
          <strong>Message:</strong><br>
          ${contactSubmission.message.replace(/\n/g, '<br>')}
        </div>
        <p>If you have any further questions, please don't hesitate to contact us again.</p>
        <p>Best regards,<br>${process.env.COMPANY_NAME || 'The Team'}</p>
      </div>
    `;

    const text = `
Dear ${contactSubmission.name},

Thank you for reaching out to us. Here is our response to your inquiry:

${replyMessage}

For your reference, your original message was:

Subject: ${contactSubmission.subject}
Message:
${contactSubmission.message}

If you have any further questions, please don't hesitate to contact us again.

Best regards,
${process.env.COMPANY_NAME || 'The Team'}
    `;

    return this.sendEmail({
      to,
      subject,
      text,
      html,
    });
  }

  /**
   * Send new contact form submission notification to admin
   * @param {Object} contactSubmission - Contact submission object
   * @returns {Promise} - Email send result
   */
  async sendNewContactNotification(contactSubmission) {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      logger.warn('Admin email not configured, contact notification not sent');
      return null;
    }

    const subject = `New Contact Form Submission: ${contactSubmission.subject}`;
    const html = `
      <div>
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${contactSubmission.name}</p>
        <p><strong>Email:</strong> ${contactSubmission.email}</p>
        <p><strong>Subject:</strong> ${contactSubmission.subject}</p>
        <p><strong>Message:</strong></p>
        <div style="padding: 15px; border-left: 4px solid #ccc; margin: 10px 0;">
          ${contactSubmission.message.replace(/\n/g, '<br>')}
        </div>
        <p><a href="${process.env.ADMIN_URL}/contact/${contactSubmission.id}">View in admin panel</a></p>
      </div>
    `;

    const text = `
New Contact Form Submission

Name: ${contactSubmission.name}
Email: ${contactSubmission.email}
Subject: ${contactSubmission.subject}
Message:
${contactSubmission.message}

View in admin panel: ${process.env.ADMIN_URL}/contact/${contactSubmission.id}
    `;

    return this.sendEmail({
      to: adminEmail,
      subject,
      text,
      html,
    });
  }
}

module.exports = new EmailService(); 