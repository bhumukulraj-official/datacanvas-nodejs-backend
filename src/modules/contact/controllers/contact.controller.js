const { AppError } = require('../../../shared/errors');
const ContactSubmission = require('../models/ContactSubmission');
const { validateRecaptcha } = require('../../../shared/utils/recaptcha');
const logger = require('../../../shared/utils/logger');
const rateLimit = require('../../../shared/utils/rate-limit');

/**
 * Submit a contact form
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.submitContactForm = async (req, res, next) => {
  try {
    const { name, email, subject, message, recaptchaToken } = req.body;

    // Check rate limiting
    const ipAddress = req.ip || req.connection.remoteAddress;
    const rateLimitKey = `contact:${ipAddress}`;
    
    const rateLimited = await rateLimit.check(rateLimitKey, 5, 60 * 60); // 5 requests per hour
    if (rateLimited) {
      throw new AppError('Too many contact submissions. Please try again later.', 429, 'RATE_003');
    }

    // Validate recaptcha if enabled
    if (process.env.RECAPTCHA_ENABLED === 'true') {
      const recaptchaValid = await validateRecaptcha(recaptchaToken);
      if (!recaptchaValid) {
        throw new AppError('Invalid recaptcha verification. Please try again.', 400, 'CAPTCHA_001');
      }
    }

    // Create contact submission
    const submission = await ContactSubmission.create({
      name,
      email,
      subject,
      message,
      ip_address: ipAddress,
      user_agent: req.headers['user-agent'],
      recaptcha_token: recaptchaToken,
    });

    // Track rate limiting
    await rateLimit.increment(rateLimitKey, 60 * 60);

    logger.info('New contact submission received', { 
      id: submission.id, 
      email: submission.email,
      subject: submission.subject
    });

    res.status(201).json({
      success: true,
      data: {
        message: 'Your message has been sent successfully. We will get back to you soon.',
        id: submission.id
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all contact submissions (Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.listContactSubmissions = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;
    
    const offset = (page - 1) * limit;
    const where = {};
    
    if (status) {
      where.status = status;
    }

    const { count, rows: submissions } = await ContactSubmission.findAndCountAll({
      where,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: [[sortBy, sortOrder]],
    });

    res.status(200).json({
      success: true,
      data: {
        submissions,
        pagination: {
          total: count,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single contact submission by ID (Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getContactSubmission = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const submission = await ContactSubmission.findByPk(id);
    
    if (!submission) {
      throw new AppError('Contact submission not found', 404, 'NOT_001');
    }

    res.status(200).json({
      success: true,
      data: {
        submission
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a contact submission (Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateContactSubmission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes, assigned_to } = req.body;
    
    const submission = await ContactSubmission.findByPk(id);
    
    if (!submission) {
      throw new AppError('Contact submission not found', 404, 'NOT_001');
    }

    // Update only allowed fields
    if (status) submission.status = status;
    if (notes) submission.notes = notes;
    if (assigned_to !== undefined) submission.assigned_to = assigned_to;

    await submission.save();

    res.status(200).json({
      success: true,
      data: {
        submission
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reply to a contact submission (Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.replyToContactSubmission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reply_message } = req.body;
    
    const submission = await ContactSubmission.findByPk(id);
    
    if (!submission) {
      throw new AppError('Contact submission not found', 404, 'NOT_001');
    }

    // Update reply information
    submission.reply_message = reply_message;
    submission.replied_at = new Date();
    submission.status = 'replied';
    
    await submission.save();

    // Here you would typically send an email with the reply to the contact
    // This would integrate with an email service

    res.status(200).json({
      success: true,
      data: {
        message: 'Reply sent successfully',
        submission
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a contact submission (Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.deleteContactSubmission = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const submission = await ContactSubmission.findByPk(id);
    
    if (!submission) {
      throw new AppError('Contact submission not found', 404, 'NOT_001');
    }

    await submission.destroy();

    res.status(200).json({
      success: true,
      data: {
        message: 'Contact submission deleted successfully'
      }
    });
  } catch (error) {
    next(error);
  }
}; 