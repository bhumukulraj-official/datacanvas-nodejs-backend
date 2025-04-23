const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../../../shared/middleware/auth.middleware');
const preferenceController = require('../controllers/preference.controller');
const {
  validateUpdatePreferences,
  validateUpdateCategoryPreferences,
} = require('../validators/preference.validator');

/**
 * @route GET /api/v1/notifications/preferences
 * @desc Get user notification preferences
 * @access Private
 */
router.get(
  '/',
  authenticateJWT,
  preferenceController.getPreferences
);

/**
 * @route PUT /api/v1/notifications/preferences
 * @desc Update user notification preferences
 * @access Private
 */
router.put(
  '/',
  authenticateJWT,
  validateUpdatePreferences,
  preferenceController.updatePreferences
);

/**
 * @route POST /api/v1/notifications/preferences/reset
 * @desc Reset notification preferences to defaults
 * @access Private
 */
router.post(
  '/reset',
  authenticateJWT,
  preferenceController.resetPreferences
);

/**
 * @route PUT /api/v1/notifications/preferences/categories/:category
 * @desc Update preferences for a specific category
 * @access Private
 */
router.put(
  '/categories/:category',
  authenticateJWT,
  validateUpdateCategoryPreferences,
  preferenceController.updateCategoryPreferences
);

module.exports = router; 