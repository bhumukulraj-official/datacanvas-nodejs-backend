/**
 * Configuration Routes
 * Handles routing for system configuration API endpoints
 */
const express = require('express');
const configController = require('../controllers/config.controller');
const auth = require('../../../shared/middleware/auth');

const router = express.Router();

// Protect all routes - admin access only
router.use(auth.protect);
router.use(auth.restrictTo('admin'));

// Configuration management
router.route('/')
  .get(configController.getAllConfigurations);

router.route('/:key')
  .get(configController.getConfiguration)
  .put(configController.updateConfiguration)
  .delete(configController.deleteConfiguration);

// Cache management
router.post('/cache/refresh', configController.refreshCache);

// Maintenance mode management
router.route('/maintenance')
  .get(configController.getMaintenanceStatus)
  .post(configController.enableMaintenanceMode)
  .delete(configController.disableMaintenanceMode);

module.exports = router; 