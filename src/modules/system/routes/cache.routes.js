/**
 * Cache routes
 */
const express = require('express');
const cacheController = require('../controllers/cache.controller');
const cacheValidator = require('../validators/cache.validator');
const auth = require('../../../shared/middleware/auth.middleware');
const validate = require('../../../shared/middleware/validate.middleware');

const router = express.Router();

// All cache routes require admin role
router.use(auth.requireAuth);
router.use(auth.requireRole('admin'));

// Get cache statistics
router.get(
  '/stats',
  cacheController.getCacheStats
);

// Clear all cache items
router.post(
  '/clear',
  cacheController.clearAllCache
);

// Clear cache items in a namespace
router.post(
  '/clear/:namespace',
  validate(cacheValidator.clearNamespaceCache),
  cacheController.clearNamespaceCache
);

// Get a cache item
router.get(
  '/item',
  validate(cacheValidator.getCacheItem),
  cacheController.getCacheItem
);

// Delete a cache item
router.delete(
  '/item',
  validate(cacheValidator.deleteCacheItem),
  cacheController.deleteCacheItem
);

module.exports = router; 