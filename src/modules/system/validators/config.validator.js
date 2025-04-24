/**
 * Configuration Validator
 * Validation schemas for configuration API requests
 */
const Joi = require('joi');

// Validate getting a single configuration
const getConfiguration = {
  params: Joi.object({
    key: Joi.string().required()
      .description('Configuration key to retrieve')
  })
};

// Validate getting all configurations
const getAllConfigurations = {
  query: Joi.object({
    prefix: Joi.string()
      .description('Optional prefix to filter configurations by')
  })
};

// Validate updating a configuration
const updateConfiguration = {
  params: Joi.object({
    key: Joi.string().required()
      .description('Configuration key to update')
  }),
  body: Joi.object({
    value: Joi.required()
      .description('New configuration value'),
    type: Joi.string()
      .valid('string', 'number', 'boolean', 'json')
      .default('string')
      .description('Type of configuration value'),
    description: Joi.string()
      .description('Optional description of the configuration')
  })
};

// Validate deleting a configuration
const deleteConfiguration = {
  params: Joi.object({
    key: Joi.string().required()
      .description('Configuration key to delete')
  })
};

// Validate enabling maintenance mode
const enableMaintenanceMode = {
  body: Joi.object({
    message: Joi.string()
      .description('Optional custom maintenance message'),
    allowAdminAccess: Joi.boolean()
      .description('Whether to allow admin users during maintenance mode')
  })
};

module.exports = {
  getConfiguration,
  getAllConfigurations,
  updateConfiguration,
  deleteConfiguration,
  enableMaintenanceMode
}; 