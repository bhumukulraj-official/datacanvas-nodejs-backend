const { AuthService } = require('../../../services/auth');
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