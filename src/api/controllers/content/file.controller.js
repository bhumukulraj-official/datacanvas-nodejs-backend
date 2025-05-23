const { FileService } = require('../../../services/content');
const { authenticate } = require('../../middlewares/auth.middleware');
const { processUpload } = require('../../middlewares/upload.middleware');

class FileController {
  async uploadFile(req, res, next) {
    try {
      const file = await FileService.createFileRecord({
        ...req.file,
        user_id: req.user.id
      });
      res.status(201).json({
        success: true,
        data: file
      });
    } catch (error) {
      next(error);
    }
  }

  async getFile(req, res, next) {
    try {
      const file = await FileService.getFileByUuid(req.params.fileId);
      res.json({
        success: true,
        data: file
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FileController(); 