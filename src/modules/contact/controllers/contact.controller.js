const { Op } = require('sequelize');
const { AppError } = require('../../../shared/errors');
const ContactSubmission = require('../models/ContactSubmission');
const { validateRecaptcha } = require('../../../shared/utils/recaptcha');
const logger = require('../../../shared/utils/logger');
const rateLimit = require('../../../shared/utils/rate-limit');
const emailService = require('../../../shared/services/email.service');
const User = require('../../auth/models/User');
const { sequelize } = require('../../../shared/database');

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

    let recaptchaScore = null;
    
    // Validate recaptcha if enabled
    if (process.env.RECAPTCHA_ENABLED === 'true') {
      const recaptchaResult = await validateRecaptcha(recaptchaToken);
      if (!recaptchaResult.success) {
        throw new AppError('Invalid recaptcha verification. Please try again.', 400, 'CAPTCHA_001');
      }
      recaptchaScore = recaptchaResult.score;
      
      // Optionally mark as spam if score is too low
      if (recaptchaScore < 0.3) {
        logger.warn('Possible spam contact submission detected', { 
          email, 
          ipAddress, 
          recaptchaScore 
        });
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
      recaptcha_score: recaptchaScore,
      status: recaptchaScore && recaptchaScore < 0.3 ? 'spam' : 'new'
    });

    // Track rate limiting
    await rateLimit.increment(rateLimitKey, 60 * 60);

    // Send notification email
    try {
      await emailService.sendNewContactNotification(submission);
    } catch (emailError) {
      logger.error('Failed to send contact notification email', { error: emailError });
      // Don't fail the request if email sending fails
    }

    logger.info('New contact submission received', { 
      id: submission.id, 
      email: submission.email,
      subject: submission.subject,
      recaptchaScore
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
    const { 
      page = 1, 
      limit = 10, 
      status, 
      sortBy = 'created_at', 
      sortOrder = 'DESC',
      search,
      fromDate,
      toDate
    } = req.query;
    
    const offset = (page - 1) * limit;
    const where = {};
    
    // Status filter
    if (status) {
      where.status = status;
    }
    
    // Date range filter
    if (fromDate && toDate) {
      where.created_at = {
        [Op.between]: [new Date(fromDate), new Date(toDate)]
      };
    } else if (fromDate) {
      where.created_at = {
        [Op.gte]: new Date(fromDate)
      };
    } else if (toDate) {
      where.created_at = {
        [Op.lte]: new Date(toDate)
      };
    }
    
    // Search functionality
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { subject: { [Op.like]: `%${search}%` } },
        { message: { [Op.like]: `%${search}%` } }
      ];
    }

    // Find submissions with included user data for assigned_to
    const { count, rows: submissions } = await ContactSubmission.findAndCountAll({
      where,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: [[sortBy, sortOrder]],
      include: [
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'name', 'email'],
          required: false
        }
      ]
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
    
    const submission = await ContactSubmission.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'name', 'email'],
          required: false
        }
      ]
    });
    
    if (!submission) {
      throw new AppError('Contact submission not found', 404, 'NOT_001');
    }

    // If status is 'new', update it to 'read'
    if (submission.status === 'new') {
      submission.status = 'read';
      await submission.save();
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
    if (notes !== undefined) submission.notes = notes;
    if (assigned_to !== undefined) submission.assigned_to = assigned_to;

    await submission.save();

    // Get updated submission with user data
    const updatedSubmission = await ContactSubmission.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'name', 'email'],
          required: false
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: {
        submission: updatedSubmission
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

    // Send reply email
    try {
      await emailService.sendContactReply(submission, reply_message);
      
      res.status(200).json({
        success: true,
        data: {
          message: 'Reply sent successfully',
          submission
        }
      });
    } catch (error) {
      logger.error('Failed to send reply email', { error, submissionId: id });
      throw new AppError('Failed to send reply email. Please try again.', 500, 'EMAIL_001');
    }
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

/**
 * Get contact submission statistics (Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getContactStats = async (req, res, next) => {
  try {
    // Get total counts by status
    const statusCounts = await ContactSubmission.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    // Get counts by date for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyCounts = await ContactSubmission.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        created_at: {
          [Op.gte]: thirtyDaysAgo
        }
      },
      group: [sequelize.fn('DATE', sequelize.col('created_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']]
    });

    // Format the results
    const statusStats = {};
    statusCounts.forEach(item => {
      statusStats[item.status] = parseInt(item.get('count'), 10);
    });

    const totalCount = Object.values(statusStats).reduce((sum, count) => sum + count, 0);

    res.status(200).json({
      success: true,
      data: {
        total: totalCount,
        byStatus: statusStats,
        dailyTrend: dailyCounts.map(item => ({
          date: item.get('date'),
          count: parseInt(item.get('count'), 10)
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Export contact submissions (Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.exportContactSubmissions = async (req, res, next) => {
  try {
    const { status, fromDate, toDate, format = 'csv' } = req.query;
    
    const where = {};
    
    // Status filter
    if (status) {
      where.status = status;
    }
    
    // Date range filter
    if (fromDate && toDate) {
      where.created_at = {
        [Op.between]: [new Date(fromDate), new Date(toDate)]
      };
    } else if (fromDate) {
      where.created_at = {
        [Op.gte]: new Date(fromDate)
      };
    } else if (toDate) {
      where.created_at = {
        [Op.lte]: new Date(toDate)
      };
    }

    // Get all submissions matching the filters
    const submissions = await ContactSubmission.findAll({
      where,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'name', 'email'],
          required: false
        }
      ]
    });

    // Format data according to the requested format
    if (format === 'json') {
      // Send as JSON
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=contact-submissions.json');
      
      return res.status(200).json(submissions.map(sub => sub.toJSON()));
      
    } else if (format === 'csv') {
      // Generate CSV
      const csvHeader = 'ID,Name,Email,Subject,Message,Status,Created At,Updated At,Replied At,Reply Message,Notes,Assigned To\n';
      
      const csvRows = submissions.map(sub => {
        const row = [
          sub.id,
          `"${sub.name.replace(/"/g, '""')}"`,
          `"${sub.email}"`,
          `"${sub.subject.replace(/"/g, '""')}"`,
          `"${sub.message.replace(/"/g, '""')}"`,
          sub.status,
          sub.created_at,
          sub.updated_at,
          sub.replied_at || '',
          sub.reply_message ? `"${sub.reply_message.replace(/"/g, '""')}"` : '',
          sub.notes ? `"${sub.notes.replace(/"/g, '""')}"` : '',
          sub.assignedUser ? `"${sub.assignedUser.name}"` : ''
        ];
        
        return row.join(',');
      }).join('\n');
      
      const csvContent = csvHeader + csvRows;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=contact-submissions.csv');
      
      return res.status(200).send(csvContent);
    }
    
    // Default fallback if format is neither JSON nor CSV
    throw new AppError('Unsupported export format. Use csv or json.', 400, 'FORMAT_001');
    
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk update contact submissions (Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.bulkUpdateContactSubmissions = async (req, res, next) => {
  try {
    const { ids, status, assigned_to } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new AppError('Invalid or empty IDs array', 400, 'BULK_001');
    }
    
    if (!status && assigned_to === undefined) {
      throw new AppError('No update parameters provided', 400, 'BULK_002');
    }

    const updateFields = {};
    if (status) updateFields.status = status;
    if (assigned_to !== undefined) updateFields.assigned_to = assigned_to;

    // Perform bulk update
    const [updatedCount] = await ContactSubmission.update(updateFields, {
      where: {
        id: {
          [Op.in]: ids
        }
      }
    });

    res.status(200).json({
      success: true,
      data: {
        message: `${updatedCount} contact submissions updated successfully`,
        count: updatedCount
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk delete contact submissions (Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.bulkDeleteContactSubmissions = async (req, res, next) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new AppError('Invalid or empty IDs array', 400, 'BULK_001');
    }

    // Perform bulk delete (soft delete with paranoid)
    const deletedCount = await ContactSubmission.destroy({
      where: {
        id: {
          [Op.in]: ids
        }
      }
    });

    res.status(200).json({
      success: true,
      data: {
        message: `${deletedCount} contact submissions deleted successfully`,
        count: deletedCount
      }
    });
  } catch (error) {
    next(error);
  }
}; 