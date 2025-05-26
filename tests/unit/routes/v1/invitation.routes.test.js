const express = require('express');
const invitationRoutes = require('../../../../src/api/routes/v1/invitation.routes');

describe('Invitation Routes', () => {
  it('should export a router', () => {
    expect(invitationRoutes).toBeDefined();
    expect(typeof invitationRoutes).toBe('function');
  });
});
