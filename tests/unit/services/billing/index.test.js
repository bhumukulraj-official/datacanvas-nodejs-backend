const billingServices = require('../../../../src/services/billing');

describe('Billing Services Index', () => {
  test('should export all billing services', () => {
    expect(billingServices).toHaveProperty('InvoiceService');
    expect(billingServices).toHaveProperty('PaymentService');
    expect(billingServices).toHaveProperty('EncryptionService');
    expect(billingServices).toHaveProperty('WebhookService');
  });

  test('should export services as objects', () => {
    expect(typeof billingServices.InvoiceService).toBe('object');
    expect(typeof billingServices.PaymentService).toBe('object');
    expect(typeof billingServices.EncryptionService).toBe('object');
    expect(typeof billingServices.WebhookService).toBe('object');
  });
}); 