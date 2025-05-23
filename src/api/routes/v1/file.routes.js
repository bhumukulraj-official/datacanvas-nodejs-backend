const express = require('express');
const router = express.Router();
const { fileController } = require('../../controllers/content');
const { authenticate } = require('../../middlewares/auth.middleware');
const { processUpload } = require('../../middlewares/upload.middleware');

router.get('/:fileId', fileController.getFile);

// Authenticated routes
router.use(authenticate);

router.post('/upload',
  processUpload('file'),
  fileController.uploadFile
);

module.exports = router; 