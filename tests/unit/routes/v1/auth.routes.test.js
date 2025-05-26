const express = require('express');
const authRoutes = require('../../../../src/api/routes/v1/auth.routes');

describe('Auth Routes', () => {
  it('should export a router', () => {
    expect(authRoutes).toBeDefined();
    expect(typeof authRoutes).toBe('function');
  });
}); 