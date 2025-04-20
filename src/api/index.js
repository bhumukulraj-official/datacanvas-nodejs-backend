/**
 * API Version Router
 * 
 * This file manages API versioning and routes incoming requests to the appropriate version handler.
 * It implements a clean version routing strategy with proper headers and validation.
 */
const express = require('express');
const { AppError } = require('../shared/errors');
const logger = require('../shared/utils/logger');
const { 
  validateVersion, 
  addVersionHeaders, 
  addDeprecationWarning,
  SUPPORTED_VERSIONS,
  LATEST_VERSION,
  DEFAULT_VERSION
} = require('../shared/middleware/version.middleware');

// Import version routers
const v1Router = require('./v1/routes');

// Create main router
const router = express.Router();

// Apply version middleware to all routes
router.use(validateVersion);
router.use(addVersionHeaders);
router.use(addDeprecationWarning);

// Route to specific version routers
router.use('/v1', v1Router);

// Default route to latest version
router.use('/', (req, res, next) => {
  // Redirect to default version if no specific version requested
  const handler = require(`./${DEFAULT_VERSION}/routes`);
  return handler(req, res, next);
});

// Catch-all for unsupported versions (shouldn't reach here due to validateVersion middleware)
router.use('/:version', (req, res) => {
  res.status(400).json({
    success: false,
    error: {
      code: 'API_001',
      message: `API version ${req.params.version} is not supported. Supported versions: ${SUPPORTED_VERSIONS.join(', ')}`,
      timestamp: new Date().toISOString()
    }
  });
});

module.exports = router; 