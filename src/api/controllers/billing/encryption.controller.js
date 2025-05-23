const { EncryptionService } = require('../../../services/billing');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');

class EncryptionController {
  async rotateKey(req, res, next) {
    try {
      const key = await EncryptionService.rotateEncryptionKey(
        req.user.id,
        req.ip
      );
      res.status(201).json({
        success: true,
        data: key
      });
    } catch (error) {
      next(error);
    }
  }

  async getKeyHistory(req, res, next) {
    try {
      const history = await EncryptionService.getKeyHistory(req.params.version);
      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EncryptionController(); 