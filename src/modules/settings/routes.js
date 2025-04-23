const express = require('express');
const settingsController = require('./controllers/settings.controller');
const settingsValidator = require('./validators/settings.validator');
const auth = require('../../shared/middleware/auth.middleware');
const validate = require('../../shared/middleware/validate.middleware');

const router = express.Router();

// Public routes - anyone can read settings
router.get('/', settingsController.getSettings);
router.get('/:key', validate(settingsValidator.getSettingsByKey), settingsController.getSettingsByKey);

// Protected routes - admin only for updates
router.put('/', 
  auth.requireAuth, 
  auth.requireRole('admin'), 
  validate(settingsValidator.updateSettings), 
  settingsController.updateSettings
);

router.patch('/:key', 
  auth.requireAuth, 
  auth.requireRole('admin'), 
  validate(settingsValidator.updateSettingsByKey), 
  settingsController.updateSettingsByKey
);

router.post('/reset', 
  auth.requireAuth, 
  auth.requireRole('admin'), 
  settingsController.resetSettings
);

module.exports = router; 