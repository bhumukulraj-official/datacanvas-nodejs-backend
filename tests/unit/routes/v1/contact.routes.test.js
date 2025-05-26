const express = require('express');
const contactRoutes = require('../../../../src/api/routes/v1/contact.routes');

describe('Contact Routes', () => {
  it('should export a router', () => {
    expect(contactRoutes).toBeDefined();
    expect(typeof contactRoutes).toBe('function');
  });
});
