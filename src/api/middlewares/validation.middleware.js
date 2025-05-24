const { validation } = require('../../utils/validation.util');
const { ValidationError } = require('../../utils/error.util');
const logger = require('../../utils/logger.util');

const validate = (schema, payloadLocation = 'body') => {
  logger.debug(`Initializing validation middleware for ${payloadLocation}`);
  
  return (req, res, next) => {
    logger.debug(`Validating ${payloadLocation} with schema`, { 
      schema: schema.describe(),
      payload: req[payloadLocation]
    });

    const { error, value } = schema.validate(req[payloadLocation], {
      abortEarly: false,
      allowUnknown: false
    });

    if (error) {
      logger.warn('Validation failed', { 
        errors: error.details,
        payload: req[payloadLocation]
      });
      const details = error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message
      }));
      
      return next(new ValidationError('Validation failed', 'VALIDATION_ERROR', { errors: details }));
    }

    logger.debug('Validation successful', { validatedData: value });
    req[payloadLocation] = value;
    next();
  };
};

module.exports = validate; 