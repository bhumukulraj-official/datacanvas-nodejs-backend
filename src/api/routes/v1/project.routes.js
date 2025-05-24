const express = require('express');
const router = express.Router();
const { ProjectController } = require('../../controllers/content');
const { authenticate } = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validation.middleware');
const { schemas } = require('../../../utils/validation.util');

// Public routes
router.get('/featured', ProjectController.getFeaturedProjects);
router.get('/all', ProjectController.getAllProjects);
router.get('/:id', ProjectController.getProject);

// Project updates (public access)
router.get('/:projectId/updates', ProjectController.getProjectUpdates);
router.get('/:projectId/updates/:updateId', ProjectController.getProjectUpdate);

// Authenticated routes
router.use(authenticate);

// Project routes
router.post('/',
  validate(schemas.project.create, 'body'),
  ProjectController.createProject
);

router.put('/:id',
  validate(schemas.project.update, 'body'),
  ProjectController.updateProject
);

// Project updates routes
router.post('/:projectId/updates',
  validate(schemas.project.projectUpdate.create, 'body'),
  ProjectController.createProjectUpdate
);

router.put('/:projectId/updates/:updateId',
  validate(schemas.project.projectUpdate.update, 'body'),
  ProjectController.updateProjectUpdate
);

router.delete('/:projectId/updates/:updateId',
  ProjectController.deleteProjectUpdate
);

module.exports = router; 