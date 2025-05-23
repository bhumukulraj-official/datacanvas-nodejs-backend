const { SearchService } = require('../../../services/content');
const { authenticate } = require('../../middlewares/auth.middleware');

class SearchController {
  async searchProjects(req, res, next) {
    try {
      const results = await SearchService.searchProjects(req.query.q);
      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      next(error);
    }
  }

  async indexProject(req, res, next) {
    try {
      await SearchService.indexProject(req.params.projectId);
      res.json({
        success: true,
        message: 'Project indexed successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SearchController(); 