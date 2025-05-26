const express = require('express');
const userRoutes = require('../../../../src/api/routes/v1/user.routes');

describe('User Routes', () => {
  it('should export a router', () => {
    expect(userRoutes).toBeDefined();
    expect(typeof userRoutes).toBe('function');
  });
});
