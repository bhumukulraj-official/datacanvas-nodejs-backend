const mediaService = require('../services/media.service');
const { AppError } = require('../../../shared/errors');
const logger = require('../../../shared/utils/logger');

/**
 * @api {post} /api/v1/media/upload Upload media file
 * @apiName UploadMedia
 * @apiGroup Media
 * @apiVersion 1.0.0
 * 
 * @apiHeader {String} Authorization User's JWT token
 * 
 * @apiParam {File} file Media file (required)
 * @apiParam {String} type Media type (required, enum: ['image', 'document', 'video', 'audio'])
 * @apiParam {String} description Description (optional)
 * @apiParam {String} visibility Visibility (optional, enum: ['public', 'private'], default: 'public')
 * 
 * @apiSuccess {Boolean} success Indicates successful operation
 * @apiSuccess {Object} data Uploaded media data
 * @apiSuccess {String} message Success message
 */
exports.uploadMedia = async (req, res, next) => {
  try {
    const { type, description, visibility } = req.body;
    const file = req.file;
    
    if (!file) {
      throw new AppError('No file uploaded', 400, 'FILE_003');
    }
    
    // Get user from authentication middleware
    const userData = req.user;
    
    const media = await mediaService.uploadMedia(file, userData, type, description);
    
    // Update visibility if provided
    if (visibility && visibility !== media.visibility) {
      media.visibility = visibility;
      await media.save();
    }
    
    // Format the response to match API spec
    const response = {
      id: media.id,
      url: media.url,
      type: media.type,
      size: media.size,
      filename: media.filename,
      uploadedAt: media.uploaded_at,
      metadata: media.metadata,
      thumbnailUrl: media.thumbnail_url,
    };
    
    res.status(201).json({
      success: true,
      data: response,
      message: 'Media uploaded successfully',
    });
  } catch (error) {
    logger.error('Media upload error', { error });
    next(error);
  }
};

/**
 * @api {get} /api/v1/media Get media list
 * @apiName GetMediaList
 * @apiGroup Media
 * @apiVersion 1.0.0
 * 
 * @apiHeader {String} Authorization User's JWT token
 * 
 * @apiParam {Number} [page=1] Page number
 * @apiParam {Number} [limit=20] Items per page
 * @apiParam {String} [type] Filter by media type
 * @apiParam {String} [search] Search by filename
 * 
 * @apiSuccess {Boolean} success Indicates successful operation
 * @apiSuccess {Object} data Media list and pagination data
 * @apiSuccess {String} message Success message
 */
exports.listMedia = async (req, res, next) => {
  try {
    const { page, limit, type, search } = req.query;
    
    // Get user from authentication middleware
    const userId = req.user.id;
    
    const result = await mediaService.listMedia({
      page,
      limit,
      type,
      search,
      userId,
    });
    
    // Format the media items to match API spec
    const formattedMedia = result.media.map(media => ({
      id: media.id,
      url: media.url,
      type: media.type,
      size: media.size,
      filename: media.filename,
      description: media.description,
      uploadedAt: media.uploaded_at,
      thumbnailUrl: media.thumbnail_url,
      optimizedUrl: media.optimized_url,
    }));
    
    res.status(200).json({
      success: true,
      data: {
        media: formattedMedia,
        pagination: result.pagination,
      },
      message: 'Media list retrieved successfully',
    });
  } catch (error) {
    logger.error('Media list error', { error });
    next(error);
  }
};

/**
 * @api {get} /api/v1/media/:id Get media details
 * @apiName GetMediaDetails
 * @apiGroup Media
 * @apiVersion 1.0.0
 * 
 * @apiHeader {String} Authorization User's JWT token
 * 
 * @apiParam {Number} id Media ID
 * 
 * @apiSuccess {Boolean} success Indicates successful operation
 * @apiSuccess {Object} data Media details
 * @apiSuccess {String} message Success message
 */
exports.getMediaDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get user from authentication middleware
    const userId = req.user.id;
    
    const media = await mediaService.getMediaById(id, userId);
    
    // Format the response to match API spec
    const response = {
      id: media.id,
      url: media.url,
      type: media.type,
      size: media.size,
      filename: media.filename,
      description: media.description,
      visibility: media.visibility,
      uploadedAt: media.uploaded_at,
      metadata: media.metadata,
      thumbnailUrl: media.thumbnail_url,
      optimizedUrl: media.optimized_url,
      optimizedSize: media.optimized_size,
      optimizationMetadata: media.optimization_metadata,
      createdAt: media.created_at,
      updatedAt: media.updated_at,
    };
    
    res.status(200).json({
      success: true,
      data: response,
      message: 'Media details retrieved successfully',
    });
  } catch (error) {
    logger.error('Get media details error', { error, mediaId: req.params.id });
    next(error);
  }
};

/**
 * @api {delete} /api/v1/media/:id Delete media
 * @apiName DeleteMedia
 * @apiGroup Media
 * @apiVersion 1.0.0
 * 
 * @apiHeader {String} Authorization User's JWT token
 * 
 * @apiParam {Number} id Media ID
 * 
 * @apiSuccess {Boolean} success Indicates successful operation
 * @apiSuccess {String} message Success message
 */
exports.deleteMedia = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get user from authentication middleware
    const userId = req.user.id;
    
    await mediaService.deleteMedia(id, userId);
    
    res.status(200).json({
      success: true,
      message: 'Media deleted successfully',
    });
  } catch (error) {
    logger.error('Delete media error', { error, mediaId: req.params.id });
    next(error);
  }
};

/**
 * @api {post} /api/v1/media/:id/optimize Optimize media
 * @apiName OptimizeMedia
 * @apiGroup Media
 * @apiVersion 1.0.0
 * 
 * @apiHeader {String} Authorization User's JWT token
 * 
 * @apiParam {Number} id Media ID
 * @apiParam {Number} [quality=80] Quality (1-100)
 * @apiParam {String} [format] Format (jpg, png, webp)
 * @apiParam {Number} [width] Width in pixels
 * @apiParam {Number} [height] Height in pixels
 * 
 * @apiSuccess {Boolean} success Indicates successful operation
 * @apiSuccess {Object} data Optimized media details
 * @apiSuccess {String} message Success message
 */
exports.optimizeMedia = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quality, format, width, height } = req.body;
    
    // Get user from authentication middleware
    const userId = req.user.id;
    
    const media = await mediaService.optimizeMedia(id, userId, { quality, format, width, height });
    
    // Format the response to match API spec
    const response = {
      id: media.id,
      url: media.url,
      optimizedUrl: media.optimized_url,
      originalSize: media.size,
      optimizedSize: media.optimized_size,
      compressionRatio: media.optimization_metadata.compressionRatio,
      quality: media.optimization_metadata.quality,
      format: media.optimization_metadata.format,
      processedAt: media.optimization_metadata.processedAt,
    };
    
    res.status(200).json({
      success: true,
      data: response,
      message: 'Media optimized successfully',
    });
  } catch (error) {
    logger.error('Optimize media error', { error, mediaId: req.params.id });
    next(error);
  }
}; 