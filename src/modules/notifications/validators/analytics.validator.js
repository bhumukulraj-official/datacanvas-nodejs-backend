const Joi = require('joi');

/**
 * Get user analytics schema
 */
const getUserAnalytics = {
  query: Joi.object({
    type: Joi.string().valid('system', 'user', 'security', 'content', 'account', 'project', 'billing', 'social'),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('startDate'))
  }).unknown(true)
};

/**
 * Track notification action schema
 */
const trackNotificationAction = {
  body: Joi.object({
    notificationId: Joi.number().integer().required(),
    action: Joi.string().required(),
    source: Joi.string().valid('api', 'websocket', 'push', 'email').default('api'),
    metadata: Joi.object().default({})
  })
};

/**
 * Get system analytics schema (admin only)
 */
const getSystemAnalytics = {
  query: Joi.object({
    type: Joi.string().valid('system', 'user', 'security', 'content', 'account', 'project', 'billing', 'social'),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('startDate'))
  }).unknown(true)
};

module.exports = {
  getUserAnalytics,
  trackNotificationAction,
  getSystemAnalytics
}; 