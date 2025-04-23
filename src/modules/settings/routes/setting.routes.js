/**
 * Settings routes
 */
const express = require('express');
const { settingController } = require('../controllers');
const { auth, validate } = require('../../../middleware');
const { settingValidator } = require('../validators');

const router = express.Router();

// Public route for getting public settings - no auth required
router.get(
  '/public',
  settingController.getPublicSettings
);

// All other routes require authentication
router.use(auth());

// Get all settings (admin only)
router.get(
  '/',
  settingController.getAllSettings
);

// Update all settings (admin only)
router.put(
  '/',
  validate(settingValidator.updateSettings),
  settingController.updateSettings
);

// Get a single setting by key
router.get(
  '/:key',
  settingController.getSetting
);

// Update a single setting by key (admin only)
router.patch(
  '/:key',
  validate(settingValidator.updateSingle),
  settingController.updateSetting
);

module.exports = router; 