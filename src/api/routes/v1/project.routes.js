const express = require('express');
const router = express.Router();
const { ProjectController } = require('../../controllers/content');
const { authenticate } = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validation.middleware');
const { schemas } = require('../../../utils/validation.util');

router.get('/featured', ProjectController.getFeaturedProjects);
router.get('/:id', ProjectController.getProject);

// Authenticated routes
router.use(authenticate);

router.post('/',
  validate(schemas.project.create, 'body'),
  ProjectController.createProject
);

router.put('/:id',
  validate(schemas.project.update, 'body'),
  ProjectController.updateProject
);

module.exports = router; 