const Joi = require('joi');

/**
 * Email notifications preference schema
 */
const emailNotificationsSchema = Joi.object({
  enabled: Joi.boolean().required(),
  digest: Joi.object({
    enabled: Joi.boolean().required(),
    frequency: Joi.string().valid('daily', 'weekly').required(),
  }).required(),
});

/**
 * Push notifications preference schema
 */
const pushNotificationsSchema = Joi.object({
  enabled: Joi.boolean().required(),
  browser: Joi.boolean().required(),
  mobile: Joi.boolean().required(),
});

/**
 * Category preference schema
 */
const categorySchema = Joi.object({
  enabled: Joi.boolean().required(),
  email: Joi.boolean().required(),
  push: Joi.boolean().required(),
});

/**
 * Categories preferences schema
 */
const categoriesSchema = Joi.object({
  system: categorySchema.required(),
  security: categorySchema.required(),
  content: categorySchema.required(),
  account: categorySchema.required(),
  project: categorySchema.required(),
  billing: categorySchema.required(),
  social: categorySchema.required(),
});

/**
 * Update preferences schema
 */
const updatePreferencesSchema = Joi.object({
  emailNotifications: emailNotificationsSchema,
  pushNotifications: pushNotificationsSchema,
  categories: Joi.object().pattern(
    Joi.string().valid('system', 'security', 'content', 'account', 'project', 'billing', 'social'),
    categorySchema
  ),
}).min(1);

/**
 * Update category preferences schema
 */
const updateCategoryPreferencesSchema = Joi.object({
  enabled: Joi.boolean(),
  email: Joi.boolean(),
  push: Joi.boolean(),
}).min(1);

/**
 * Middleware to validate preference update
 */
const validateUpdatePreferences = (req, res, next) => {
  const { error } = updatePreferencesSchema.validate(req.body);
  
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
 * Middleware to validate category preference update
 */
const validateUpdateCategoryPreferences = (req, res, next) => {
  const { error } = updateCategoryPreferencesSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message,
      code: 'VALIDATION_ERROR',
    });
  }
  
  next();
};

// Alias for route compatibility
const updatePreferences = validateUpdatePreferences;

module.exports = {
  validateUpdatePreferences,
  validateUpdateCategoryPreferences,
  // Export aliases for route compatibility
  updatePreferences
}; 