const express = require('express');
const controller = require('./controllers/project.controller');
const validator = require('./validators/project.validator');
const auth = require('../../shared/middleware/auth.middleware');

const router = express.Router();

/**
 * Public routes - accessible without authentication
 */
router.get('/', validator.listProjects, controller.listProjects);
router.get('/:id', validator.getProject, controller.getProject);

/**
 * Admin routes - require authentication
 */
router.post('/', auth.requireAuth, validator.createProject, controller.createProject);
router.put('/:id', auth.requireAuth, validator.updateProject, controller.updateProject);
router.delete('/:id', auth.requireAuth, validator.deleteProject, controller.deleteProject);

module.exports = router; 