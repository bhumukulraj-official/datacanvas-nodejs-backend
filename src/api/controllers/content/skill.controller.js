const { SkillService } = require('../../../services/content');
const { authenticate } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validation.middleware');
const { schemas } = require('../../../utils/validation.util');

class SkillController {
  async getHighlightedSkills(req, res, next) {
    try {
      const skills = await SkillService.getHighlightedSkills();
      res.json({
        success: true,
        data: skills
      });
    } catch (error) {
      next(error);
    }
  }

  async getSkillsByCategory(req, res, next) {
    try {
      const skills = await SkillService.getSkillsByCategory(req.params.category);
      res.json({
        success: true,
        data: skills
      });
    } catch (error) {
      next(error);
    }
  }

  async updateSkillProficiency(req, res, next) {
    try {
      const skill = await SkillService.updateSkillProficiency(
        req.params.id,
        req.body.proficiency
      );
      res.json({
        success: true,
        data: skill
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SkillController(); 