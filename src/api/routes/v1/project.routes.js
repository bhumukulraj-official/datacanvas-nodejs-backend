const express = require('express');
const router = express.Router();
const { projectController } = require('../../controllers/content');
const { authenticate } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validation.middleware');
const { schemas } = require('../../../utils/validation.util');

router.get('/featured', projectController.getFeaturedProjects);
router.get('/:id', projectController.getProject);

// Authenticated routes
router.use(authenticate);

router.post('/',
  validate(schemas.project.create, 'body'),
  projectController.createProject
);

router.put('/:id',
  validate(schemas.project.update, 'body'),
  projectController.updateProject
);

module.exports = router; 