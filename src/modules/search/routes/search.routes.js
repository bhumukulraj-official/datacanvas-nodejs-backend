/**
 * Search routes
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

module.exports = router; 