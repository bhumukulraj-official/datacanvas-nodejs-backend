const { InvoiceService } = require('../../../services/billing');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validation.middleware');
const { schemas } = require('../../../utils/validation.util');

class InvoiceController {
  async createInvoice(req, res, next) {
    try {
      const invoice = await InvoiceService.createInvoice(
        req.body,
        req.body.items
      );
      res.status(201).json({
        success: true,
        data: invoice
      });
    } catch (error) {
      next(error);
    }
  }

  async getInvoice(req, res, next) {
    try {
      const invoice = await InvoiceService.getInvoiceWithItems(req.params.id);
      res.json({
        success: true,
        data: invoice
      });
    } catch (error) {
      next(error);
    }
  }

  async updateInvoiceStatus(req, res, next) {
    try {
      const invoice = await InvoiceService.updateInvoiceStatus(
        req.params.id,
        req.body.status
      );
      res.json({
        success: true,
        data: invoice
      });
    } catch (error) {
      next(error);
    }
  }

  async getClientInvoices(req, res, next) {
    try {
      const invoices = await InvoiceService.getClientInvoices(req.params.clientId);
      res.json({
        success: true,
        data: invoices
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new InvoiceController(); 