const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../../../shared/middleware/auth');
const projectController = require('../../controllers/project.controller');

// All routes require authentication and admin role
router.use(authenticate);
router.use(authorize(['admin']));

// Admin project routes
router.post('/', projectController.createProject);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);
router.patch('/:id/status', projectController.updateProjectStatus);
router.patch('/:id/featured', projectController.updateProjectFeatured);

module.exports = router; 