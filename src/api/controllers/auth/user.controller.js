const { UserService } = require('../../../services/auth');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validation.middleware');
const { schemas } = require('../../../utils/validation.util');

class UserController {
  async register(req, res, next) {
    try {
      const user = await UserService.registerUser(req.body);
      res.status(201).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      const profile = await UserService.getProfile(req.user.id);
      res.json({
        success: true,
        data: profile
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const updatedProfile = await UserService.updateProfile(req.user.id, req.body);
      res.json({
        success: true,
        data: updatedProfile
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController(); 