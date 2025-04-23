const Joi = require('joi');

/**
 * Save push subscription schema
 */
const saveSubscription = {
  body: Joi.object({
    subscription: Joi.object({
      endpoint: Joi.string().required(),
      keys: Joi.object({
        p256dh: Joi.string().required(),
        auth: Joi.string().required()
      }).required()
    }).required(),
    deviceInfo: Joi.object({
      userAgent: Joi.string().allow(''),
      deviceType: Joi.string().valid('browser', 'mobile', 'desktop', 'tablet').default('browser'),
      metadata: Joi.object().default({})
    }).default({})
  })
};

/**
 * Delete push subscription schema
 */
const deleteSubscription = {
  body: Joi.object({
    endpoint: Joi.string().required()
  })
};

module.exports = {
  saveSubscription,
  deleteSubscription
}; 