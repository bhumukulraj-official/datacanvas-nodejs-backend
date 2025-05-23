const { WebhookService } = require('../../../services/billing');

class WebhookController {
  async processWebhook(req, res, next) {
    try {
      const result = await WebhookService.processIncomingWebhook(
        req.body,
        req.headers
      );
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async retryWebhooks(req, res, next) {
    try {
      const results = await WebhookService.retryFailedWebhooks();
      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WebhookController(); 