const { PaymentService } = require('../../../services/billing');
const { authenticate } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validation.middleware');
const { schemas } = require('../../../utils/validation.util');

class PaymentController {
  async processPayment(req, res, next) {
    try {
      const payment = await PaymentService.processPayment(req.body);
      res.status(201).json({
        success: true,
        data: payment
      });
    } catch (error) {
      next(error);
    }
  }

  async handleWebhook(req, res, next) {
    try {
      const result = await PaymentService.handlePaymentWebhook(
        req.body,
        req.headers['x-signature']
      );
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getPaymentHistory(req, res, next) {
    try {
      const payments = await PaymentService.getPaymentHistory(req.params.clientId);
      res.json({
        success: true,
        data: payments
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PaymentController(); 