/**
 * Health Routes
 * Handles routing for health check API endpoints
 */
const express = require('express');
const healthController = require('../controllers/health.controller');
const auth = require('../../../shared/middleware/auth');

const router = express.Router();

// Public health check endpoint - available to all
router.get('/', healthController.getBasicHealth);

// Detailed health check endpoint - admin only
router.get(
  '/detailed',
  auth.protect,
  auth.restrictTo('admin'),
  healthController.getDetailedHealth
);

module.exports = router; 