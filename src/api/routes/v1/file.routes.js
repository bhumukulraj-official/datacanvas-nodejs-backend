const express = require('express');
const router = express.Router();
const { FileController } = require('../../controllers/content');
const { authenticate } = require('../../middlewares/auth.middleware');
const { processUpload } = require('../../middlewares/upload.middleware');

router.get('/:fileId', FileController.getFile);

// Authenticated routes
router.use(authenticate);

router.post('/upload',
  processUpload('file'),
  FileController.uploadFile
);

module.exports = router; 