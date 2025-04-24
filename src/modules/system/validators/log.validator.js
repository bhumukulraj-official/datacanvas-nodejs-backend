/**
 * Log validators
 * Validates request parameters for log routes
 */
const Joi = require('joi');

exports.getLogContent = {
  params: Joi.object().keys({
    fileName: Joi.string().required().pattern(/^[\w.-]+$/)
  }),
  query: Joi.object().keys({
    tail: Joi.number().integer().min(1).max(10000),
    filter: Joi.string().max(100),
    level: Joi.string().valid('error', 'warn', 'info', 'debug'),
    startDate: Joi.string().isoDate(),
    endDate: Joi.string().isoDate()
  })
};

exports.setLoggingLevel = {
  body: Joi.object().keys({
    level: Joi.string().required().valid('error', 'warn', 'info', 'debug')
  })
};

exports.deleteLogFile = {
  params: Joi.object().keys({
    fileName: Joi.string().required().pattern(/^[\w.-]+$/)
  })
};

exports.archiveOldLogs = {
  body: Joi.object().keys({
    days: Joi.number().integer().min(1).max(365).default(30)
  })
}; 