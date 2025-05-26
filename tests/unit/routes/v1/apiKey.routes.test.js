const express = require('express');
const apiKeyRoutes = require('../../../../src/api/routes/v1/apiKey.routes');

describe('ApiKey Routes', () => {
  it('should export a router', () => {
    expect(apiKeyRoutes).toBeDefined();
    expect(typeof apiKeyRoutes).toBe('function');
  });
});
