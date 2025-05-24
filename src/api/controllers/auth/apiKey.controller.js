const { ApiKeyService } = require('../../../services/auth');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validation.middleware');
const { schemas } = require('../../../utils/validation.util');
const logger = require('../../../utils/logger.util');

class ApiKeyController {
  async createApiKey(req, res, next) {
    try {
      logger.debug('Creating API key', { userId: req.user.id, body: req.body });
      const apiKey = await ApiKeyService.createApiKey(req.user.id, req.body.name);
      logger.info('API key created successfully', { keyId: apiKey.id });
      res.status(201).json({
        success: true,
        data: apiKey
      });
    } catch (error) {
      logger.error('Error creating API key', { error: error.message });
      next(error);
    }
  }

  async rotateApiKey(req, res, next) {
    try {
      const apiKey = await ApiKeyService.rotateApiKey(req.params.keyId);
      res.json({
        success: true,
        data: apiKey
      });
    } catch (error) {
      next(error);
    }
  }

  async listApiKeys(req, res, next) {
    try {
      const apiKeys = await ApiKeyService.getUserApiKeys(req.user.id);
      res.json({
        success: true,
        data: apiKeys
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ApiKeyController(); 