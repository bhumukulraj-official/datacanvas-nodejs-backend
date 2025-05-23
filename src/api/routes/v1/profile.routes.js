const express = require('express');
const router = express.Router();
const { profileController } = require('../../controllers/content');
const { authenticate } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validation.middleware');
const { schemas } = require('../../../utils/validation.util');

router.get('/:userId', profileController.getProfile);

// Authenticated routes
router.use(authenticate);

router.put('/social-links',
  validate(schemas.profile.socialLinks, 'body'),
  profileController.updateSocialLinks
);

module.exports = router; 