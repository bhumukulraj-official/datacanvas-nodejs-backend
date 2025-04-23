const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const emailController = require('../controllers/email.controller');
const passwordController = require('../controllers/password.controller');
const authValidator = require('../validators/auth.validator');
const { authenticate } = require('../middleware/auth.middleware');
const { authRateLimiter, accountRecoveryRateLimiter } = require('../../../shared/middleware/rate-limit.middleware');
const { authSecurityHeaders } = require('../../../shared/middleware/security.middleware');

// Import session routes
const sessionRoutes = require('./session.routes');

// Apply security headers to all auth routes
router.use(authSecurityHeaders());

/**
 * @route POST /api/v1/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', authRateLimiter(), authValidator.validateRegister, authController.register);

/**
 * @route POST /api/v1/auth/login
 * @desc Login a user
 * @access Public
 */
router.post('/login', authRateLimiter(), authValidator.validateLogin, authController.login);

/**
 * @route POST /api/v1/auth/refresh
 * @desc Refresh access token
 * @access Public
 */
router.post('/refresh', authRateLimiter(), authValidator.validateRefreshToken, authController.refreshToken);

/**
 * @route POST /api/v1/auth/logout
 * @desc Logout a user
 * @access Private
 */
router.post('/logout', authenticate, authValidator.validateLogout, authController.logout);

/**
 * @route POST /api/v1/auth/logout-all
 * @desc Logout from all devices
 * @access Private
 */
router.post('/logout-all', authenticate, authController.logoutAll);

/**
 * @route POST /api/v1/auth/change-password
 * @desc Change user password
 * @access Private
 */
router.post(
  '/change-password',
  authenticate,
  authValidator.validateChangePassword,
  authController.changePassword
);

/**
 * @route POST /api/v1/auth/verify-email
 * @desc Verify user email
 * @access Public
 */
router.post(
  '/verify-email',
  authRateLimiter(),
  authValidator.validateVerifyEmail,
  emailController.verifyEmail
);

/**
 * @route POST /api/v1/auth/resend-verification
 * @desc Resend verification email
 * @access Public
 */
router.post(
  '/resend-verification',
  authRateLimiter(),
  authValidator.validateResendVerification,
  emailController.resendVerification
);

/**
 * @route POST /api/v1/auth/reset-password/request
 * @desc Request password reset
 * @access Public
 */
router.post(
  '/reset-password/request',
  accountRecoveryRateLimiter(),
  authValidator.validateResetPasswordRequest,
  passwordController.requestPasswordReset
);

/**
 * @route POST /api/v1/auth/reset-password/confirm
 * @desc Confirm password reset
 * @access Public
 */
router.post(
  '/reset-password/confirm',
  accountRecoveryRateLimiter(),
  authValidator.validateResetPasswordConfirm,
  passwordController.confirmPasswordReset
);

// Register session management routes
router.use('/sessions', sessionRoutes);

module.exports = router; 