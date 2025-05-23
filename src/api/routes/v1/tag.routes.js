const express = require('express');
const router = express.Router();
const { TagController } = require('../../controllers/content');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validation.middleware');
const { schemas } = require('../../../utils/validation.util');

router.get('/', TagController.searchTags);
router.get('/technology', TagController.getTechnologyTags);

// Authenticated routes
router.use(authenticate);

router.post('/',
  authorize(['admin']),
  validate(schemas.tag.create, 'body'),
  TagController.createTag
);

router.put('/:id',
  authorize(['admin']),
  validate(schemas.tag.update, 'body'),
  TagController.updateTag
);

module.exports = router; 