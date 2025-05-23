const logger = require('../../utils/logger.util');
const { CustomError } = require('../../utils/error.util');

const errorHandler = (err, req, res, next) => {
  logger.error(`[${err.name}] ${err.message}`);

  const response = {
    success: false,
    error: {
      code: err.errorCode || 'SERVER_ERROR',
      message: err.message || 'Internal Server Error',
      ...(err.data && { details: err.data })
    }
  };

  const statusCode = err.statusCode || 500;
  
  if (process.env.NODE_ENV === 'development') {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

const notFoundHandler = (req, res) => {
  throw new CustomError(`Route ${req.method} ${req.path} not found`, 404, 'NOT_FOUND');
};

module.exports = { errorHandler, notFoundHandler }; 