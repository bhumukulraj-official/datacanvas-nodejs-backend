/**
 * Projects services index file
 * Exports project services
 */

const projectService = require('./project.service');
const projectEnhancedService = require('./project-enhanced.service');
const projectWebhookService = require('./project-webhook.service');

module.exports = {
  projectService,
  projectEnhancedService,
  projectWebhookService
}; 