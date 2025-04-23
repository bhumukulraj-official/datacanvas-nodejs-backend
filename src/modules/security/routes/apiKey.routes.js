/**
 * API Key routes
 */
const express = require('express');
const { apiKeyController } = require('../controllers');
const { auth, validate } = require('../../../middleware');
const { apiKeyValidator } = require('../validators');

const router = express.Router();

// All routes require authentication
router.use(auth());

// Get all API keys for the authenticated user
router.get(
  '/',
  validate(apiKeyValidator.getApiKeys),
  apiKeyController.getApiKeys
);

// Get API key by ID
router.get(
  '/:id',
  validate(apiKeyValidator.getApiKeyById),
  apiKeyController.getApiKeyById
);

// Create a new API key
router.post(
  '/',
  validate(apiKeyValidator.createApiKey),
  apiKeyController.createApiKey
);

// Update an API key
router.patch(
  '/:id',
  validate(apiKeyValidator.updateApiKey),
  apiKeyController.updateApiKey
);

// Revoke an API key
router.post(
  '/:id/revoke',
  validate(apiKeyValidator.revokeApiKey),
  apiKeyController.revokeApiKey
);

// Delete an API key
router.delete(
  '/:id',
  validate(apiKeyValidator.deleteApiKey),
  apiKeyController.deleteApiKey
);

module.exports = router; 