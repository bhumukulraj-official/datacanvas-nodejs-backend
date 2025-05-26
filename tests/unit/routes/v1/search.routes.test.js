const express = require('express');
const searchRoutes = require('../../../../src/api/routes/v1/search.routes');

describe('Search Routes', () => {
  it('should export a router', () => {
    expect(searchRoutes).toBeDefined();
    expect(typeof searchRoutes).toBe('function');
  });
});
