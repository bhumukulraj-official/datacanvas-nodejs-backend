/**
 * Media Optimization routes
 */
const express = require('express');
const { optimizationController } = require('../controllers');
const { auth, validate } = require('../../../middleware');
const { optimizationValidator } = require('../validators');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth());

// Get optimization status for a media item
router.get(
  '/:id',
  validate(optimizationValidator.getOptimizationStatus),
  optimizationController.getOptimizationStatus
);

// Optimize any media based on its type
router.post(
  '/:id',
  validate(optimizationValidator.optimizeMedia),
  optimizationController.optimizeMedia
);

// Optimize an image with specific options
router.post(
  '/:id/image',
  validate(optimizationValidator.optimizeImage),
  optimizationController.optimizeImage
);

module.exports = router; 