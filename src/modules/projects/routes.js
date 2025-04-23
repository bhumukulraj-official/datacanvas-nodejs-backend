const express = require('express');
const controller = require('./controllers/project.controller');
const validator = require('./validators/project.validator');
const auth = require('../../shared/middleware/auth.middleware');

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
 * Protected routes - require authentication
 */
router.post('/', auth.requireAuth, validator.createProject, controller.createProject);
router.put('/id/:id', auth.requireAuth, validator.updateProject, controller.updateProject);
router.patch('/id/:id/status', auth.requireAuth, validator.updateProjectStatus, controller.updateProjectStatus);
router.delete('/id/:id', auth.requireAuth, validator.deleteProject, controller.deleteProject);

module.exports = router; 