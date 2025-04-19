const { body } = require('express-validator');
const { validate } = require('../../../shared/middleware/validate.middleware');

// Register user validation
exports.validateRegister = validate([
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
    .matches(/[\W_]/)
    .withMessage('Password must contain at least one special character'),
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('role')
    .optional()
    .isIn(['admin', 'user'])
    .withMessage('Role must be either admin or user'),
]);

// Login validation
exports.validateLogin = validate([
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
]);

// Refresh token validation
exports.validateRefreshToken = validate([
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required'),
]);

// Logout validation
exports.validateLogout = validate([
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required'),
]);

// Change password validation
exports.validateChangePassword = validate([
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('New password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('New password must contain at least one lowercase letter')
    .matches(/\d/)
    .withMessage('New password must contain at least one number')
    .matches(/[\W_]/)
    .withMessage('New password must contain at least one special character')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password cannot be the same as your current password');
      }
      return true;
    }),
]);

// Email verification token validation
exports.validateVerifyEmail = validate([
  body('token')
    .notEmpty()
    .withMessage('Verification token is required'),
]);

// Resend verification email validation
exports.validateResendVerification = validate([
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address'),
]);

// Reset password request validation
exports.validateResetPasswordRequest = validate([
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address'),
]);

// Reset password confirmation validation
exports.validateResetPasswordConfirm = validate([
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('New password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('New password must contain at least one lowercase letter')
    .matches(/\d/)
    .withMessage('New password must contain at least one number')
    .matches(/[\W_]/)
    .withMessage('New password must contain at least one special character'),
]); 