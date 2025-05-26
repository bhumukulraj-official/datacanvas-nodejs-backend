const express = require('express');
const healthRoutes = require('../../../../src/api/routes/v1/health.routes');

describe('Health Routes', () => {
  it('should export a router', () => {
    expect(healthRoutes).toBeDefined();
    expect(typeof healthRoutes).toBe('function');
  });
});
