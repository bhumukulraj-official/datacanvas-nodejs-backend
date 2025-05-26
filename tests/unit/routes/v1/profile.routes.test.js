const express = require('express');
const profileRoutes = require('../../../../src/api/routes/v1/profile.routes');

describe('Profile Routes', () => {
  it('should export a router', () => {
    expect(profileRoutes).toBeDefined();
    expect(typeof profileRoutes).toBe('function');
  });
});
