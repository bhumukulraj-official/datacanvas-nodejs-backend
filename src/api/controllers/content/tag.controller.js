const { TagService } = require('../../../services/content');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validation.middleware');
const { schemas } = require('../../../utils/validation.util');
const { CustomError } = require('../../../utils/error.util');

class TagController {
  async createTag(req, res, next) {
    try {
      const tag = await TagService.createTag(req.body);
      res.status(201).json({
        success: true,
        data: tag
      });
    } catch (error) {
      next(error);
    }
  }

  async searchTags(req, res, next) {
    try {
      const tags = await TagService.searchTags(req.query.query);
      res.json({
        success: true,
        data: tags
      });
    } catch (error) {
      next(error);
    }
  }

  async getTechnologyTags(req, res, next) {
    try {
      const tags = await TagService.getTechnologyTags();
      res.json({
        success: true,
        data: tags
      });
    } catch (error) {
      next(error);
    }
  }

  async updateTag(req, res, next) {
    try {
      const tag = await TagService.updateTag(req.params.id, req.body);
      res.json({
        success: true,
        data: tag
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TagController(); 