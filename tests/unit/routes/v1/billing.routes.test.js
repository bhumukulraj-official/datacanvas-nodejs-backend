const express = require('express');
const billingRoutes = require('../../../../src/api/routes/v1/billing.routes');

describe('Billing Routes', () => {
  it('should export a router', () => {
    expect(billingRoutes).toBeDefined();
    expect(typeof billingRoutes).toBe('function');
  });
});
