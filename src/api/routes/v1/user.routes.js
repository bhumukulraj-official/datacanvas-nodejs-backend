const express = require('express');
const router = express.Router();
const { userController } = require('../../controllers/auth');
const { authenticate } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validation.middleware');
const { schemas } = require('../../../utils/validation.util');

// Registration
router.post('/register',
  validate(schemas.user.register, 'body'),
  userController.register
);

// Authenticated routes
router.use(authenticate);

// Profile management
router.get('/profile', userController.getProfile);
router.put('/profile',
  validate(schemas.user.updateProfile, 'body'),
  userController.updateProfile
);

module.exports = router; 