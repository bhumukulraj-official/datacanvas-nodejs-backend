const { validation } = require('../../utils/validation.util');
const { ValidationError } = require('../../utils/error.util');

const validate = (schema, payloadLocation = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[payloadLocation], {
      abortEarly: false,
      allowUnknown: false
    });

    if (error) {
      const details = error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message
      }));
      
      return next(new ValidationError('Validation failed', 'VALIDATION_ERROR', { errors: details }));
    }

    req[payloadLocation] = value;
    next();
  };
};

module.exports = validate; 