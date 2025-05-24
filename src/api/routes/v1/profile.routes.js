const express = require('express');
const router = express.Router();
const { ProfileController } = require('../../controllers/content');
const { authenticate } = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validation.middleware');
const { schemas } = require('../../../utils/validation.util');

router.get('/:userId', ProfileController.getProfile);

// Authenticated routes
router.use(authenticate);

router.put('/social-links',
  validate(schemas.profile.socialLinks, 'body'),
  ProfileController.updateSocialLinks
);

module.exports = router; 