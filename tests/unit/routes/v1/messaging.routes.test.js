const express = require('express');
const messagingRoutes = require('../../../../src/api/routes/v1/messaging.routes');

describe('Messaging Routes', () => {
  it('should export a router', () => {
    expect(messagingRoutes).toBeDefined();
    expect(typeof messagingRoutes).toBe('function');
  });
});
