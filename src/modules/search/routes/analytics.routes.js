/**
 * Search Analytics Routes
 */
const express = require('express');
const router = express.Router();
const searchAnalyticsController = require('../controllers/search-analytics.controller');
const { authenticate, authorize } = require('../../../shared/middleware/auth');
const { validate } = require('../../../shared/middleware');
const analyticsValidator = require('../validators/analytics.validator');

// Public routes
// None

// Protected routes (admin only)
router.use(authenticate);
router.use(authorize(['admin']));

// Analytics endpoints
router.get(
  '/popular',
  validate(analyticsValidator.getPopularSearches),
  searchAnalyticsController.getPopularSearches
);

router.get(
  '/zero-results',
  validate(analyticsValidator.getZeroResultSearches),
  searchAnalyticsController.getZeroResultSearches
);

router.get(
  '/trends',
  validate(analyticsValidator.getSearchTrends),
  searchAnalyticsController.getSearchTrends
);

router.get(
  '/stats',
  validate(analyticsValidator.getSearchStats),
  searchAnalyticsController.getSearchStats
);

// User-specific search history (requires admin or ownership)
router.get(
  '/history',
  validate(analyticsValidator.getUserSearchHistory),
  searchAnalyticsController.getUserSearchHistory
);

module.exports = router; 