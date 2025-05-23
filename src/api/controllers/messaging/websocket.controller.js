const { WebsocketService } = require('../../../services/messaging');
const { authenticate } = require('../../middlewares/auth.middleware');

class WebsocketController {
  async getConnectionMessages(req, res, next) {
    try {
      const messages = await WebsocketService.getConnectionMessages(
        req.params.connectionId
      );
      res.json({
        success: true,
        data: messages
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WebsocketController(); 