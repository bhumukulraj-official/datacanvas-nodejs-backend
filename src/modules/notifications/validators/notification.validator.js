const Joi = require('joi');

/**
 * Validation schema for notification creation
 */
const createNotificationSchema = Joi.object({
  user_id: Joi.number().integer().positive().required(),
  type: Joi.string().valid('system', 'user', 'security', 'content', 'account', 'project', 'billing', 'social').required(),
  title: Joi.string().min(2).max(100).required(),
  message: Joi.string().required(),
  category: Joi.string().max(50).allow(null),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
  status: Joi.string().valid('unread', 'read', 'archived').default('unread'),
  metadata: Joi.object().default({}),
});

/**
 * Validation schema for updating notification
 */
const updateNotificationSchema = Joi.object({
  read: Joi.boolean(),
  status: Joi.string().valid('unread', 'read', 'archived'),
});

/**
 * Validation schema for notification list filters
 */
const getNotificationsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  read: Joi.boolean(),
  type: Joi.string().valid('system', 'user', 'security', 'content', 'account', 'project', 'billing', 'social'),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical'),
  status: Joi.string().valid('unread', 'read', 'archived'),
  category: Joi.string().max(50),
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().greater(Joi.ref('startDate')),
});

/**
 * Middleware to validate notification creation
 */
const validateCreateNotification = (req, res, next) => {
  const { error } = createNotificationSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message,
      code: 'VALIDATION_ERROR',
    });
  }
  
  next();
};

/**
 * Middleware to validate notification update
 */
const validateUpdateNotification = (req, res, next) => {
  const { error } = updateNotificationSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message,
      code: 'VALIDATION_ERROR',
    });
  }
  
  next();
};

/**
 * Middleware to validate notification list request
 */
const validateGetNotifications = (req, res, next) => {
  const { error } = getNotificationsSchema.validate(req.query);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message,
      code: 'VALIDATION_ERROR',
    });
  }
  
  next();
};

module.exports = {
  validateCreateNotification,
  validateUpdateNotification,
  validateGetNotifications,
}; 