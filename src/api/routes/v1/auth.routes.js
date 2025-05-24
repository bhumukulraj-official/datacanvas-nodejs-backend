const express = require('express');
const router = express.Router();
const validate = require('../../middlewares/validation.middleware');
const { schemas } = require('../../../utils/validation.util');
const { AuthController } = require('../../controllers/auth');
const { authenticate } = require('../../middlewares/auth.middleware');

// Authentication routes
router.post('/login', 
  validate(schemas.auth.login, 'body'),
  AuthController.login
);

router.post('/logout',
  validate(schemas.auth.logout, 'body'),
  AuthController.logout
);

router.post('/refresh-token',
  validate(schemas.auth.refreshToken, 'body'),
  AuthController.refreshToken
);

router.post('/verify-email',
  validate(schemas.auth.verifyEmail, 'body'),
  AuthController.verifyEmail
);

router.post('/resend-verification',
  validate(schemas.auth.resendVerification, 'body'),
  AuthController.resendVerification
);

router.post('/change-password',
  authenticate,
  validate(schemas.auth.changePassword, 'body'),
  AuthController.changePassword
);

router.post('/request-password-reset',
  validate(schemas.auth.requestPasswordReset, 'body'),
  AuthController.requestPasswordReset
);

router.post('/reset-password',
  validate(schemas.auth.resetPassword, 'body'),
  AuthController.resetPassword
);

module.exports = router; 