const { ProfileService } = require('../../../services/content');
const { authenticate } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validation.middleware');
const { schemas } = require('../../../utils/validation.util');

class ProfileController {
  async getProfile(req, res, next) {
    try {
      const profile = await ProfileService.getProfile(req.params.userId);
      res.json({
        success: true,
        data: profile
      });
    } catch (error) {
      next(error);
    }
  }

  async updateSocialLinks(req, res, next) {
    try {
      const profile = await ProfileService.updateSocialLinks(
        req.user.id,
        req.body
      );
      res.json({
        success: true,
        data: profile
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProfileController(); 