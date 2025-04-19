const { validationResult } = require('express-validator');
const { AppError } = require('../errors');

/**
 * Middleware for validating request data
 * @param {Array} validations - Array of express-validator validation chains
 * @returns {Function} Express middleware function
 */
exports.validate = (validations) => {
  return async (req, res, next) => {
    // Execute all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    // Check if there are validation errors
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Format validation errors
    const formattedErrors = errors.array().map(err => ({
      field: err.param,
      message: err.msg,
    }));

    // Return validation error
    return next(
      new AppError(
        'Validation Error',
        400,
        'VAL_001',
        { errors: formattedErrors }
      )
    );
  };
}; 