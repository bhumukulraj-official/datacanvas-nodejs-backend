const express = require('express');
const controller = require('../controllers/project.controller');
const enhancedController = require('../controllers/project-enhanced.controller');
const webhookController = require('../controllers/project-webhook.controller');
const validator = require('../validators/project.validator');
const enhancedValidator = require('../validators/project-enhanced.validator');
const auth = require('../../../shared/middleware/auth.middleware');
const rateLimiter = require('../../../shared/middleware/rate-limiter.middleware');
const { validateStatusTransition, normalizeProjectStatus } = require('../middleware/project-status.middleware');

const router = express.Router();

/**
 * Public routes - accessible without authentication
 */
router.get('/', validator.listProjects, controller.listProjects);
router.get('/id/:id', validator.getProject, controller.getProject);
router.get('/slug/:slug', controller.getProjectBySlug);
router.get('/featured', (req, res, next) => {
  req.query.featured = true;
  req.query.limit = req.query.limit || 5;
  req.query.status = 'completed';
  controller.listProjects(req, res, next);
});

/**
 * Enhanced public routes
 */
router.get('/search', rateLimiter('search', 10), enhancedValidator.validateSearchProjects, enhancedController.searchProjects);
router.get('/statistics', rateLimiter('statistics', 20), enhancedController.getProjectStatistics);
router.get('/filter', rateLimiter('filter', 15), enhancedValidator.validateAdvancedFilter, enhancedController.advancedFilterProjects);
router.get('/id/:id/related', enhancedValidator.validateGetRelatedProjects, enhancedController.getRelatedProjects);
router.get('/id/:id/export', enhancedValidator.validateExportProject, enhancedController.exportProject);

/**
 * Protected routes - require authentication
 */
router.post('/', 
  auth.requireAuth, 
  normalizeProjectStatus,
  validator.createProject,
  controller.createProject
);

router.put('/id/:id', 
  auth.requireAuth, 
  normalizeProjectStatus,
  validator.updateProject, 
  validateStatusTransition,
  controller.updateProject
);

router.patch('/id/:id/status', 
  auth.requireAuth, 
  normalizeProjectStatus,
  validator.updateProjectStatus, 
  validateStatusTransition,
  controller.updateProjectStatus
);

router.delete('/id/:id', 
  auth.requireAuth, 
  validator.deleteProject, 
  controller.deleteProject
);

/**
 * Enhanced protected routes - for admin use
 */
router.patch('/id/:id/featured', 
  auth.requireAuth,
  auth.requireRole(['admin']), 
  enhancedValidator.validateManageFeaturedProject, 
  enhancedController.manageFeaturedProject
);

/**
 * Webhook routes - admin only
 */
router.get('/webhooks',
  auth.requireAuth,
  auth.requireRole(['admin']),
  webhookController.listWebhooks
);

router.post('/webhooks/register',
  auth.requireAuth,
  auth.requireRole(['admin']),
  webhookController.registerWebhook
);

router.post('/webhooks/unregister',
  auth.requireAuth,
  auth.requireRole(['admin']),
  webhookController.unregisterWebhook
);

router.post('/webhooks/test',
  auth.requireAuth,
  auth.requireRole(['admin']),
  webhookController.testWebhook
);

module.exports = router; 