const multer = require('multer');
const { FileService } = require('../../services/content');
const { CustomError } = require('../../utils/error.util');

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new CustomError('Invalid file type', 400), false);
  }
  cb(null, true);
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

const processUpload = (fieldName) => [
  upload.single(fieldName),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return next();
      }

      const fileData = {
        original_name: req.file.originalname,
        mime_type: req.file.mimetype,
        size: req.file.size,
        buffer: req.file.buffer
      };

      const fileRecord = await FileService.createFileRecord(fileData);
      req.file = fileRecord;
      next();
    } catch (error) {
      next(error);
    }
  }
];

module.exports = { upload, processUpload }; 