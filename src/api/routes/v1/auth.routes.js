const express = require('express');
const router = express.Router();
const { validate } = require('../../middlewares/validation.middleware');
const { schemas } = require('../../../utils/validation.util');
const { authController } = require('../../controllers/auth');
const { authenticate } = require('../../middlewares/auth.middleware');

// Authentication routes
router.post('/login', 
  validate(schemas.auth.login, 'body'),
  authController.login
);

router.post('/logout',
  validate(schemas.auth.logout, 'body'),
  authController.logout
);

router.post('/refresh-token',
  validate(schemas.auth.refreshToken, 'body'),
  authController.refreshToken
);

router.post('/request-password-reset',
  validate(schemas.auth.requestPasswordReset, 'body'),
  authController.requestPasswordReset
);

router.post('/reset-password',
  validate(schemas.auth.resetPassword, 'body'),
  authController.resetPassword
);

module.exports = router; 