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
      compressionRatio: media.size && media.optimized_size ? 
        (1 - (media.optimized_size / media.size)) * 100 : 0,
      quality: media.optimization_metadata.quality,
      format: media.optimization_metadata.format,
      width: media.optimization_metadata.width,
      height: media.optimization_metadata.height,
      processedAt: media.optimization_metadata.processedAt,
    };
    
    res.status(200).json({
      success: true,
      data: response,
      message: 'Media optimized successfully',
    });
  } catch (error) {
    logger.error('Media optimization error', { error, mediaId: req.params.id });
    next(error);
  }
};

/**
 * @api {get} /api/v1/media/:id/optimization Get optimization status
 * @apiName GetOptimizationStatus
 * @apiGroup Media
 * @apiVersion 1.0.0
 * 
 * @apiHeader {String} Authorization User's JWT token
 * 
 * @apiParam {Number} id Media ID
 * 
 * @apiSuccess {Boolean} success Indicates successful operation
 * @apiSuccess {Object} data Optimization details
 * @apiSuccess {String} message Success message
 */
exports.getOptimizationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get user from authentication middleware
    const userId = req.user.id;
    
    const media = await mediaService.getMediaById(id, userId);
    
    // Check if media has been optimized
    const isOptimized = !!media.optimized_url;
    
    // Format the response
    const response = {
      id: media.id,
      isOptimized: isOptimized,
      originalUrl: media.url,
      optimizedUrl: media.optimized_url,
      originalSize: media.size,
      optimizedSize: media.optimized_size,
      compressionRatio: media.size && media.optimized_size ? 
        (1 - (media.optimized_size / media.size)) * 100 : 0,
      optimizationMetadata: media.optimization_metadata
    };
    
    res.status(200).json({
      success: true,
      data: response,
      message: 'Optimization status retrieved successfully',
    });
  } catch (error) {
    logger.error('Get optimization status error', { error, mediaId: req.params.id });
    next(error);
  }
};

/**
 * @api {post} /api/v1/media/batch Batch media operations
 * @apiName BatchMediaOperations
 * @apiGroup Media
 * @apiVersion 1.0.0
 * 
 * @apiHeader {String} Authorization User's JWT token
 * 
 * @apiParam {String} operation Operation type (delete, optimize)
 * @apiParam {Array} mediaIds Array of media IDs to operate on
 * @apiParam {Object} [options] Options for the operation
 * 
 * @apiSuccess {Boolean} success Indicates successful operation
 * @apiSuccess {Object} data Operation results
 * @apiSuccess {String} message Success message
 */
exports.batchMediaOperations = async (req, res, next) => {
  try {
    const { operation, mediaIds, options } = req.body;
    
    if (!Array.isArray(mediaIds) || mediaIds.length === 0) {
      throw new AppError('Invalid media IDs', 400, 'MEDIA_001');
    }
    
    // Get user from authentication middleware
    const userId = req.user.id;
    
    let results;
    
    switch (operation) {
      case 'delete':
        results = await mediaService.batchDeleteMedia(mediaIds, userId);
        break;
      case 'optimize':
        results = await mediaService.batchOptimizeMedia(mediaIds, userId, options);
        break;
      default:
        throw new AppError(`Unsupported operation: ${operation}`, 400, 'MEDIA_002');
    }
    
    res.status(200).json({
      success: true,
      data: {
        operation,
        results
      },
      message: `Batch ${operation} operation completed successfully`,
    });
  } catch (error) {
    logger.error('Batch media operation error', { error });
    next(error);
  }
};

/**
 * @api {get} /api/v1/media/search Advanced search
 * @apiName AdvancedMediaSearch
 * @apiGroup Media
 * @apiVersion 1.0.0
 * 
 * @apiHeader {String} Authorization User's JWT token
 * 
 * @apiParam {String} [query] Search query for filename and description
 * @apiParam {String} [type] Filter by media type
 * @apiParam {String} [startDate] Filter by uploaded date (start)
 * @apiParam {String} [endDate] Filter by uploaded date (end)
 * @apiParam {Number} [minSize] Filter by minimum size in bytes
 * @apiParam {Number} [maxSize] Filter by maximum size in bytes
 * @apiParam {String} [status] Filter by status
 * @apiParam {Boolean} [optimized] Filter by whether media is optimized
 * @apiParam {String} [sortBy] Sort by field (uploadedAt, size, etc.)
 * @apiParam {String} [sortOrder] Sort order (asc, desc)
 * @apiParam {Number} [page=1] Page number
 * @apiParam {Number} [limit=20] Items per page
 * 
 * @apiSuccess {Boolean} success Indicates successful operation
 * @apiSuccess {Object} data Search results and pagination data
 * @apiSuccess {String} message Success message
 */
exports.advancedSearch = async (req, res, next) => {
  try {
    const {
      query, type, startDate, endDate, minSize, maxSize, 
      status, optimized, sortBy, sortOrder, page, limit
    } = req.query;
    
    // Get user from authentication middleware
    const userId = req.user.id;
    
    const result = await mediaService.advancedSearch({
      userId,
      query,
      type,
      startDate,
      endDate,
      minSize,
      maxSize,
      status,
      optimized: optimized === 'true',
      sortBy,
      sortOrder,
      page,
      limit
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
      status: media.status
    }));
    
    res.status(200).json({
      success: true,
      data: {
        media: formattedMedia,
        pagination: result.pagination,
      },
      message: 'Advanced search results retrieved successfully',
    });
  } catch (error) {
    logger.error('Advanced search error', { error });
    next(error);
  }
};

/**
 * @api {post} /api/v1/media/:id/associate Associate media with entity
 * @apiName AssociateMedia
 * @apiGroup Media
 * @apiVersion 1.0.0
 * 
 * @apiHeader {String} Authorization User's JWT token
 * 
 * @apiParam {Number} id Media ID
 * @apiParam {String} entityType Entity type (project, blog, etc.)
 * @apiParam {Number} entityId Entity ID
 * @apiParam {String} [relationshipType] Relationship type (featured, gallery, etc.)
 * 
 * @apiSuccess {Boolean} success Indicates successful operation
 * @apiSuccess {Object} data Association details
 * @apiSuccess {String} message Success message
 */
exports.associateMedia = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { entityType, entityId, relationshipType } = req.body;
    
    // Get user from authentication middleware
    const userId = req.user.id;
    
    const media = await mediaService.associateMedia(id, userId, {
      entityType,
      entityId,
      relationshipType: relationshipType || 'default'
    });
    
    res.status(200).json({
      success: true,
      data: {
        id: media.id,
        url: media.url,
        type: media.type,
        associated: {
          entityType,
          entityId,
          relationshipType: relationshipType || 'default'
        }
      },
      message: 'Media associated successfully',
    });
  } catch (error) {
    logger.error('Media association error', { error, mediaId: req.params.id });
    next(error);
  }
};

/**
 * @api {get} /api/v1/media/:id/temp-url Generate temporary URL
 * @apiName GenerateTemporaryURL
 * @apiGroup Media
 * @apiVersion 1.0.0
 * 
 * @apiHeader {String} Authorization User's JWT token
 * 
 * @apiParam {Number} id Media ID
 * @apiParam {Number} [expiresIn=3600] Expiration time in seconds (default: 1 hour)
 * 
 * @apiSuccess {Boolean} success Indicates successful operation
 * @apiSuccess {Object} data Temporary URL details
 * @apiSuccess {String} message Success message
 */
exports.generateTemporaryUrl = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { expiresIn = 3600 } = req.query; // Default: 1 hour
    
    // Get user from authentication middleware
    const userId = req.user.id;
    
    const result = await mediaService.generateTemporaryUrl(id, userId, expiresIn);
    
    res.status(200).json({
      success: true,
      data: {
        id: result.id,
        temporaryUrl: result.temporaryUrl,
        expiresAt: result.expiresAt
      },
      message: 'Temporary URL generated successfully',
    });
  } catch (error) {
    logger.error('Generate temporary URL error', { error, mediaId: req.params.id });
    next(error);
  }
};

/**
 * @api {get} /api/v1/media/access/:id Access media with temporary URL
 * @apiName AccessMedia
 * @apiGroup Media
 * @apiVersion 1.0.0
 * 
 * @apiParam {Number} id Media ID
 * @apiParam {String} [token] Access token for private media
 * 
 * @apiSuccess {File} Media file content
 */
exports.accessMedia = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { token } = req.query;
    
    // Find the media
    const media = await mediaService.getMediaById(id);
    
    // Check if media exists
    if (!media) {
      throw new AppError('Media not found', 404, 'MEDIA_001');
    }
    
    // Check if media is public or needs token validation
    if (media.visibility === 'private') {
      if (!token) {
        throw new AppError('Authentication required for private media', 401, 'MEDIA_AUTH_001');
      }
      
      // Validate token
      const isValidToken = await mediaService.validateMediaAccessToken(media, token);
      if (!isValidToken) {
        throw new AppError('Invalid or expired token', 403, 'MEDIA_AUTH_002');
      }
    }
    
    // Get the file from storage
    const fileStream = await mediaService.getMediaFileStream(media);
    
    // Set appropriate content type
    res.set('Content-Type', media.mime_type);
    res.set('Content-Disposition', `inline; filename="${media.filename}"`);
    
    // Stream the file to the client
    fileStream.pipe(res);
  } catch (error) {
    logger.error('Media access error', { error, mediaId: req.params.id });
    next(error);
  }
}; 