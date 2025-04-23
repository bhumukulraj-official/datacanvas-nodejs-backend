const express = require('express');
const router = express.Router();
const mediaController = require('./controllers/media.controller');
const mediaValidator = require('./validators/media.validator');
const uploadMiddleware = require('./middleware/upload.middleware');
const { requireAuth } = require('../../shared/middleware/auth.middleware');

// All media routes require authentication
router.use(requireAuth);

/**
 * @api {post} /api/v1/media/upload Upload media
 * @apiDescription Upload a new media file
 * @apiVersion 1.0.0
 */
router.post(
  '/upload',
  mediaValidator.validateMediaUpload,
  uploadMiddleware.uploadMedia('file'),
  mediaController.uploadMedia
);

/**
 * @api {get} /api/v1/media Get all media
 * @apiDescription Get all media files with pagination and filters
 * @apiVersion 1.0.0
 */
router.get(
  '/',
  mediaValidator.validateListMedia,
  mediaController.listMedia
);

/**
 * @api {get} /api/v1/media/:id Get media details
 * @apiDescription Get details of a specific media file
 * @apiVersion 1.0.0
 */
router.get(
  '/:id',
  mediaValidator.validateMediaId,
  mediaController.getMediaDetails
);

/**
 * @api {delete} /api/v1/media/:id Delete media
 * @apiDescription Delete a media file
 * @apiVersion 1.0.0
 */
router.delete(
  '/:id',
  mediaValidator.validateMediaId,
  mediaController.deleteMedia
);

/**
 * @api {post} /api/v1/media/:id/optimize Optimize media
 * @apiDescription Optimize a media file (resize, compress, convert)
 * @apiVersion 1.0.0
 */
router.post(
  '/:id/optimize',
  mediaValidator.validateMediaOptimization,
  mediaController.optimizeMedia
);

module.exports = router; 