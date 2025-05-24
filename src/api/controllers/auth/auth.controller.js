const { AuthService, PasswordService } = require('../../../services/auth');
const { validate } = require('../../middlewares/validation.middleware');
const { schemas } = require('../../../utils/validation.util');
const { CustomError } = require('../../../utils/error.util');
const logger = require('../../../utils/logger.util');

class AuthController {
  async login(req, res, next) {
    try {
      logger.debug('Login attempt', { email: req.body.email });
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      logger.info('Successful login', { email });
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Login failed', { error: error.message, email: req.body.email });
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      await AuthService.logout(refreshToken);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const tokens = await AuthService.refreshToken(refreshToken);
      res.json({
        success: true,
        data: tokens
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req, res, next) {
    try {
      const { token } = req.body;
      await AuthService.verifyEmail(token);
      res.json({
        success: true,
        message: 'Email verified successfully'
      });
    } catch (error) {
      logger.error('Email verification failed', { error: error.message });
      next(error);
    }
  }

  async resendVerification(req, res, next) {
    try {
      const { email } = req.body;
      await AuthService.resendVerificationEmail(email);
      res.json({
        success: true,
        message: 'Verification email sent successfully'
      });
    } catch (error) {
      logger.error('Resend verification failed', { error: error.message, email: req.body.email });
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      await AuthService.changePassword(req.user.id, currentPassword, newPassword);
      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      logger.error('Password change failed', { error: error.message, userId: req.user.id });
      next(error);
    }
  }

  async requestPasswordReset(req, res, next) {
    try {
      const { email } = req.body;
      await PasswordService.requestPasswordReset(email);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;
      await PasswordService.resetPassword(token, newPassword);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController(); 