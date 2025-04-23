/**
 * Backup routes
 */
const express = require('express');
const backupController = require('../controllers/backup.controller');
const backupValidator = require('../validators/backup.validator');
const auth = require('../../../shared/middleware/auth.middleware');
const validate = require('../../../shared/middleware/validate.middleware');

const router = express.Router();

// All backup routes require admin role
router.use(auth.requireAuth);
router.use(auth.requireRole('admin'));

// Create backup
router.post(
  '/',
  validate(backupValidator.createBackup),
  backupController.createBackup
);

// Restore from backup
router.post(
  '/restore',
  validate(backupValidator.restoreFromBackup),
  backupController.restoreFromBackup
);

// Get all backups
router.get(
  '/',
  validate(backupValidator.getBackups),
  backupController.getBackups
);

// Delete backup
router.delete(
  '/:backupId',
  validate(backupValidator.deleteBackup),
  backupController.deleteBackup
);

module.exports = router; 