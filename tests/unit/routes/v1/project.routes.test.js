const express = require('express');
const projectRoutes = require('../../../../src/api/routes/v1/project.routes');

describe('Project Routes', () => {
  it('should export a router', () => {
    expect(projectRoutes).toBeDefined();
    expect(typeof projectRoutes).toBe('function');
  });
});
