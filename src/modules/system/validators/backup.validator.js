/**
 * Backup validator
 * Validates backup and restore requests
 */
const { body, param, query } = require('express-validator');

/**
 * Validate backup creation request
 */
exports.createBackup = [
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .isLength({ max: 255 })
    .withMessage('Description cannot exceed 255 characters')
];

/**
 * Validate restore request
 */
exports.restoreFromBackup = [
  body('backupId')
    .notEmpty()
    .withMessage('Backup ID is required')
    .isString()
    .withMessage('Backup ID must be a string')
    .isLength({ min: 1, max: 36 })
    .withMessage('Backup ID must be between 1 and 36 characters')
];

/**
 * Validate get backups request
 */
exports.getBackups = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

/**
 * Validate delete backup request
 */
exports.deleteBackup = [
  param('backupId')
    .notEmpty()
    .withMessage('Backup ID is required')
    .isString()
    .withMessage('Backup ID must be a string')
    .isLength({ min: 1, max: 36 })
    .withMessage('Backup ID must be between 1 and 36 characters')
]; 