const { ApiKeyService } = require('../../../services/auth');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validation.middleware');
const { schemas } = require('../../../utils/validation.util');

class ApiKeyController {
  async createApiKey(req, res, next) {
    try {
      const apiKey = await ApiKeyService.createApiKey(req.user.id, req.body.name);
      res.status(201).json({
        success: true,
        data: apiKey
      });
    } catch (error) {
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