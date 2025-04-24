/**
 * Monitoring routes
 */
const express = require('express');
const monitoringController = require('../controllers/monitoring.controller');
const auth = require('../../../shared/middleware/auth.middleware');

const router = express.Router();

// Metrics endpoint - No authentication for Prometheus scraping
router.get(
  '/metrics',
  monitoringController.getMetrics
);

// System status endpoint - Requires admin role
router.get(
  '/status',
  auth.requireAuth,
  auth.requireRole('admin'),
  monitoringController.getSystemStatus
);

module.exports = router; 