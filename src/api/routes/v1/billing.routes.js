const express = require('express');
const router = express.Router();
const { 
  InvoiceController,
  PaymentController,
  EncryptionController,
  WebhookController
} = require('../../controllers/billing');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validation.middleware');
const { schemas } = require('../../../utils/validation.util');

// Public webhook endpoint
router.post('/webhooks', WebhookController.processWebhook);

// Authenticated routes
router.use(authenticate);

// Invoice routes
router.post('/invoices',
  authorize(['admin']),
  validate(schemas.invoice.create, 'body'),
  InvoiceController.createInvoice
);
router.get('/invoices/client/:clientId', InvoiceController.getClientInvoices);
router.get('/invoices/:id', InvoiceController.getInvoice);
router.put('/invoices/:id/status',
  authorize(['admin']),
  validate(schemas.invoice.updateStatus, 'body'),
  InvoiceController.updateInvoiceStatus
);

// Payment routes
router.post('/payments',
  validate(schemas.payment.process, 'body'),
  PaymentController.processPayment
);
router.get('/payments/history/:clientId', PaymentController.getPaymentHistory);

// Encryption routes
router.post('/encryption/rotate-key',
  authorize(['admin']),
  EncryptionController.rotateKey
);
router.get('/encryption/history/:version', EncryptionController.getKeyHistory);

// Webhook management routes
router.post('/webhooks/retry',
  authorize(['admin']),
  WebhookController.retryWebhooks
);

module.exports = router; 