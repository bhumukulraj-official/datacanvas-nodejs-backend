const express = require('express');
const router = express.Router();
const mediaController = require('./controllers/media.controller');
const mediaValidator = require('./validators/media.validator');
const uploadMiddleware = require('./middleware/upload.middleware');
const { requireAuth } = require('../../shared/middleware/auth.middleware');

// Routes that require authentication
router.use('/upload', requireAuth);
router.use('/batch', requireAuth);
router.use('/:id/optimize', requireAuth);
router.use('/:id/associate', requireAuth);
router.use('/:id/temp-url', requireAuth);
router.use('/search', requireAuth);

// Public route for accessing media with temporary URLs
router.get('/access/:id', mediaValidator.validateMediaAccess, mediaController.accessMedia);

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
  requireAuth,
  mediaValidator.validateListMedia,
  mediaController.listMedia
);

/**
 * @api {get} /api/v1/media/search Advanced media search
 * @apiDescription Advanced search for media with multiple filters
 * @apiVersion 1.0.0
 */
router.get(
  '/search',
  mediaValidator.validateAdvancedSearch,
  mediaController.advancedSearch
);

/**
 * @api {post} /api/v1/media/batch Batch media operations
 * @apiDescription Perform batch operations on multiple media items
 * @apiVersion 1.0.0
 */
router.post(
  '/batch',
  mediaValidator.validateBatchOperations,
  mediaController.batchMediaOperations
);

/**
 * @api {get} /api/v1/media/:id Get media details
 * @apiDescription Get details of a specific media file
 * @apiVersion 1.0.0
 */
router.get(
  '/:id',
  requireAuth,
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
  requireAuth,
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

/**
 * @api {get} /api/v1/media/:id/optimization Get optimization status
 * @apiDescription Get optimization status of a media file
 * @apiVersion 1.0.0
 */
router.get(
  '/:id/optimization',
  requireAuth,
  mediaValidator.validateMediaId,
  mediaController.getOptimizationStatus
);

/**
 * @api {post} /api/v1/media/:id/associate Associate media with entity
 * @apiDescription Associate media with another entity (project, blog, etc.)
 * @apiVersion 1.0.0
 */
router.post(
  '/:id/associate',
  mediaValidator.validateMediaAssociation,
  mediaController.associateMedia
);

/**
 * @api {get} /api/v1/media/:id/temp-url Generate temporary URL
 * @apiDescription Generate a temporary URL for accessing a media file
 * @apiVersion 1.0.0
 */
router.get(
  '/:id/temp-url',
  mediaValidator.validateTemporaryUrl,
  mediaController.generateTemporaryUrl
);

module.exports = router; 