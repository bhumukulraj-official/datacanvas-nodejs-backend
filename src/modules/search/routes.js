/**
 * Search Routes
 */
const express = require('express');
const router = express.Router();
const searchController = require('./controllers/search.controller');
const { validate } = require('../../shared/middleware');
const searchValidator = require('./validators/search.validator');
const analyticsRoutes = require('./routes/analytics.routes');

// Include analytics routes
router.use('/analytics', analyticsRoutes);

// Global search across all content
router.get(
  '/',
  validate(searchValidator.globalSearch),
  searchController.globalSearch
);

// Search suggestions endpoint
router.get(
  '/suggestions',
  validate(searchValidator.globalSearch),
  searchController.getSearchSuggestions
);

// Search within specific content type
router.get(
  '/:contentType',
  validate(searchValidator.searchByContentType),
  searchController.searchByContentType
);

module.exports = router; 