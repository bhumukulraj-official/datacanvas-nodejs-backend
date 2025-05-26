const express = require('express');
const fileRoutes = require('../../../../src/api/routes/v1/file.routes');

describe('File Routes', () => {
  it('should export a router', () => {
    expect(fileRoutes).toBeDefined();
    expect(typeof fileRoutes).toBe('function');
  });
});
