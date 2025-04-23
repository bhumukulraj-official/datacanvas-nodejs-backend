/**
 * Search API Routes
 * Enhanced with autocomplete suggestions endpoint
 */
const express = require('express');
const { searchController } = require('../controllers');
const { validate } = require('../../../middleware');
const { searchValidator } = require('../validators');

const router = express.Router();

// Global search endpoint (publicly accessible)
router.get(
  '/',
  validate(searchValidator.globalSearch),
  searchController.globalSearch
);

// Search suggestions for autocomplete
router.get(
  '/suggestions',
  validate(searchValidator.searchSuggestions), 
  searchController.getSearchSuggestions
);

// Content type specific search
router.get(
  '/:contentType',
  validate(searchValidator.contentTypeSearch),
  searchController.searchByContentType
);

module.exports = router; 