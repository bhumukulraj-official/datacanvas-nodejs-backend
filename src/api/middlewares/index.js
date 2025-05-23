const { authenticate, authorize } = require('./auth.middleware');
const { errorHandler, notFoundHandler } = require('./error.middleware');
const validate = require('./validation.middleware');
const apiLimiter = require('./rateLimit.middleware');
const corsMiddleware = require('./cors.middleware');
const { upload, processUpload } = require('./upload.middleware');
const requestLogger = require('./logging.middleware');

module.exports = {
  authenticate,
  authorize,
  errorHandler,
  notFoundHandler,
  validate,
  apiLimiter,
  corsMiddleware,
  upload,
  processUpload,
  requestLogger
}; 