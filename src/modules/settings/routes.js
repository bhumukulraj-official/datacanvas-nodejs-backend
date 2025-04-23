/**
 * Settings Routes
 * Unified routing for all settings operations
 */
const express = require('express');
const { settingsController } = require('./controllers');
const { settingsValidator } = require('./validators');
const { auth, validate } = require('../../middleware');

const router = express.Router();

// Public route for basic settings - no auth required
router.get('/public', settingsController.getPublicSettings);

// All other routes require authentication
router.use(auth());

// Get all settings (admin only)
router.get('/', settingsController.getAllSettings);

// Get settings by key
router.get('/:key', 
  validate(settingsValidator.getSettingsByKey), 
  settingsController.getSettingsByKey
);

// Update all settings (admin only)
router.put('/', 
  validate(settingsValidator.updateSettings), 
  settingsController.updateSettings
);

// Update settings by key (admin only)
router.patch('/:key', 
  validate(settingsValidator.updateSettingsByKey), 
  settingsController.updateSettingsByKey
);

// Reset settings to defaults (admin only)
router.post('/reset', 
  settingsController.resetSettings
);

// Export settings (admin only)
router.get('/export', 
  validate(settingsValidator.exportSettings),
  settingsController.exportSettings
);

// Import settings (admin only)
router.post('/import', 
  validate(settingsValidator.importSettings),
  settingsController.importSettings
);

module.exports = router; 