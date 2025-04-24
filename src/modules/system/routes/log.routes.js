/**
 * Log routes
 */
const express = require('express');
const logController = require('../controllers/log.controller');
const logValidator = require('../validators/log.validator');
const auth = require('../../../shared/middleware/auth.middleware');
const validate = require('../../../shared/middleware/validate.middleware');

const router = express.Router();

// All log routes require admin role
router.use(auth.requireAuth);
router.use(auth.requireRole('admin'));

// Get available log files
router.get(
  '/',
  logController.getLogFiles
);

// Get current logging configuration
router.get(
  '/config',
  logController.getLoggingConfig
);

// Set logging level
router.post(
  '/level',
  validate(logValidator.setLoggingLevel),
  logController.setLoggingLevel
);

// Archive old log files
router.post(
  '/archive',
  validate(logValidator.archiveOldLogs),
  logController.archiveOldLogs
);

// Get log file content
router.get(
  '/:fileName',
  validate(logValidator.getLogContent),
  logController.getLogContent
);

// Delete a log file
router.delete(
  '/:fileName',
  validate(logValidator.deleteLogFile),
  logController.deleteLogFile
);

module.exports = router; 