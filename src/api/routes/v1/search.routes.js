const express = require('express');
const router = express.Router();
const { SearchController } = require('../../controllers/content');
const { authenticate } = require('../../middlewares/auth.middleware');

router.get('/projects', SearchController.searchProjects);

// Authenticated routes
router.use(authenticate);

router.post('/index/project/:projectId', SearchController.indexProject);

module.exports = router; 