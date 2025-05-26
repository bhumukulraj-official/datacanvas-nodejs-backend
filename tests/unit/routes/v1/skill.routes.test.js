const express = require('express');
const skillRoutes = require('../../../../src/api/routes/v1/skill.routes');

describe('Skill Routes', () => {
  it('should export a router', () => {
    expect(skillRoutes).toBeDefined();
    expect(typeof skillRoutes).toBe('function');
  });
});
