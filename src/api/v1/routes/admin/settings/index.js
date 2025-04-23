/**
 * Admin Settings Routes
 */
const express = require('express');
const router = express.Router();
const { authorize } = require('../../../../../shared/middleware');

// Import settings controller and validators
const settingsController = require('../../../../../modules/settings/controllers/settings.controller');
const settingsValidator = require('../../../../../modules/settings/validators/settings.validator');

// All routes require admin role
router.use(authorize('admin'));

// Get all settings
router.get('/', settingsController.getSettings);

// Get settings by key
router.get('/:key', settingsValidator.getSettingsByKey, settingsController.getSettingsByKey);

// Update all settings
router.put('/', settingsValidator.updateSettings, settingsController.updateSettings);

// Update settings by key
router.patch('/:key', settingsValidator.updateSettingsByKey, settingsController.updateSettingsByKey);

// Reset settings to default
router.post('/reset', settingsController.resetSettings);

// Export router
module.exports = router; 