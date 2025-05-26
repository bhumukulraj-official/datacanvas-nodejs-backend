const express = require('express');
const tagRoutes = require('../../../../src/api/routes/v1/tag.routes');

describe('Tag Routes', () => {
  it('should export a router', () => {
    expect(tagRoutes).toBeDefined();
    expect(typeof tagRoutes).toBe('function');
  });
});
