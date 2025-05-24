const express = require('express');
const router = express.Router();
const { HealthController } = require('../../controllers/health');

// Health check endpoint
router.get('/', HealthController.checkHealth);

module.exports = router; 