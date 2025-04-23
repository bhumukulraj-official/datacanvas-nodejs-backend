const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const { AppError } = require('../../../shared/errors');
const Media = require('../models/Media');
const logger = require('../../../shared/utils/logger');
const { sequelize } = require('../../../shared/database');
const crypto = require('crypto');
const { Sequelize } = require('sequelize');

// Define storage base paths
const UPLOAD_BASE_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const MEDIA_DIR = path.join(UPLOAD_BASE_DIR, 'media');

// Ensure directories exist
const ensureDirectoriesExist = () => {
  const dirs = [UPLOAD_BASE_DIR, MEDIA_DIR];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Initialize directories
ensureDirectoriesExist();

/**
 * Create a new media record
 * @param {Object} mediaData - The media data to create
 * @returns {Promise<Object>} The created media object
 */
exports.createMedia = async (mediaData) => {
  try {
    const media = await Media.create(mediaData);
    return media;
  } catch (error) {
    logger.error('Error creating media', { error, mediaData });
    throw new AppError('Failed to create media record', 500, 'DB_001');
  }
};

/**
 * Get a media by ID
 * @param {number} id - The media ID
 * @param {number} userId - The user ID (for permission check)
 * @returns {Promise<Object>} The media object
 */
exports.getMediaById = async (id, userId) => {
  const media = await Media.findByPk(id);

  if (!media) {
    throw new AppError('Media not found', 404, 'NOT_001');
  }

  // Check if the media belongs to the user or is public
  if (media.visibility === 'private' && media.user_id !== userId) {
    throw new AppError('Permission denied', 403, 'PERM_001');
  }

  return media;
};

/**
 * List media with pagination and filters
 * @param {Object} options - List options
 * @param {number} options.page - Page number
 * @param {number} options.limit - Items per page
 * @param {string} options.type - Filter by media type
 * @param {string} options.search - Search by filename
 * @param {number} options.userId - Filter by user ID
 * @returns {Promise<Object>} Paginated media list
 */
exports.listMedia = async (options) => {
  const { 
    page = 1, 
    limit = 20, 
    type, 
    search, 
    userId,
    visibility = 'public'
  } = options;

  const offset = (page - 1) * limit;
  const where = {};

  // Apply filters
  if (type) {
    where.type = type;
  }

  if (search) {
    where.filename = { [sequelize.Op.iLike]: `%${search}%` };
  }

  if (userId) {
    where.user_id = userId;
  }

  if (visibility) {
    where.visibility = visibility;
  }

  // Exclude deleted or failed media
  where.status = { [sequelize.Op.ne]: 'deleted' };

  const { count, rows } = await Media.findAndCountAll({
    where,
    limit,
    offset,
    order: [['created_at', 'DESC']],
  });

  return {
    media: rows,
    pagination: {
      total: count,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      pages: Math.ceil(count / limit),
    },
  };
};

/**
 * Store an uploaded file and create a media record
 * @param {Object} file - The uploaded file object from multer
 * @param {Object} userData - Data about the user uploading the file
 * @param {string} type - The media type (image, video, document, audio)
 * @param {string} description - Optional description
 * @returns {Promise<Object>} The created media object
 */
exports.uploadMedia = async (file, userData, type, description = '') => {
  if (!file) {
    throw new AppError('No file provided', 400, 'FILE_003');
  }

  // Extract file information
  const { originalname, mimetype, size, path: tempPath } = file;
  const fileExt = path.extname(originalname).toLowerCase().substring(1);
  
  // Validate file type based on mimetype and extension
  const validatedType = validateFileType(mimetype, fileExt, type);
  
  // Generate a unique filename
  const fileName = `${uuidv4()}.${fileExt}`;
  const storagePath = `${userData.id}/${validatedType}/${fileName}`;
  const destinationPath = path.join(MEDIA_DIR, storagePath);
  
  // Ensure directory exists
  const destinationDir = path.dirname(destinationPath);
  if (!fs.existsSync(destinationDir)) {
    fs.mkdirSync(destinationDir, { recursive: true });
  }
  
  // Move the file from temp location to final destination
  try {
    fs.copyFileSync(tempPath, destinationPath);
    fs.unlinkSync(tempPath); // Remove the temp file
  } catch (error) {
    logger.error('File storage error', { error, tempPath, destinationPath });
    throw new AppError('Failed to store uploaded file', 500, 'FILE_003');
  }

  // Prepare metadata based on file type
  const metadata = await extractMetadata(validatedType, destinationPath, mimetype);
  
  // Generate thumbnail for images and videos
  let thumbnailUrl = null;
  if (validatedType === 'image') {
    thumbnailUrl = await generateThumbnail(destinationPath, storagePath);
  }

  // Create file URL (in a real environment, this would be a CDN or storage URL)
  const baseUrl = process.env.MEDIA_BASE_URL || `${process.env.API_BASE_URL || 'http://localhost:3000'}/uploads/media`;
  const fileUrl = `${baseUrl}/${storagePath}`;
  const thumbnailUrlFull = thumbnailUrl ? `${baseUrl}/${thumbnailUrl}` : null;

  // Create media record in the database
  const mediaData = {
    user_id: userData.id,
    url: fileUrl,
    storage_provider: 'local', // This would be 's3' or other providers in production
    storage_path: storagePath,
    type: validatedType,
    mime_type: mimetype,
    file_extension: fileExt,
    size,
    filename: originalname,
    description,
    visibility: 'public', // Default to public
    metadata,
    status: 'ready',
    thumbnail_url: thumbnailUrlFull,
  };

  const media = await this.createMedia(mediaData);
  return media;
};

/**
 * Delete a media by ID
 * @param {number} id - The media ID
 * @param {number} userId - The user ID (for permission check)
 * @returns {Promise<boolean>} Success indicator
 */
exports.deleteMedia = async (id, userId) => {
  const media = await this.getMediaById(id, userId);
  
  // Check if the user owns this media
  if (media.user_id !== userId) {
    throw new AppError('Permission denied', 403, 'PERM_001');
  }

  // Soft delete the record
  media.status = 'deleted';
  await media.save();

  // This would actually delete the file in a production environment
  // For now, we're just marking it as deleted in the database
  logger.info('Media deleted', { id, userId });

  return true;
};

/**
 * Optimize a media file (primarily for images)
 * @param {number} id - The media ID
 * @param {number} userId - The user ID (for permission check)
 * @param {Object} options - Optimization options
 * @returns {Promise<Object>} The updated media object
 */
exports.optimizeMedia = async (id, userId, options = {}) => {
  const media = await this.getMediaById(id, userId);
  
  // Check if the user owns this media
  if (media.user_id !== userId) {
    throw new AppError('Permission denied', 403, 'PERM_001');
  }

  // Only support image optimization for now
  if (media.type !== 'image') {
    throw new AppError('Optimization is only supported for images', 400, 'VAL_001');
  }

  const { 
    quality = 80, 
    format = path.extname(media.filename).substring(1) || 'jpeg',
    width, 
    height 
  } = options;

  // Set media status to processing
  media.status = 'processing';
  await media.save();

  try {
    // Extract the file path
    const filePath = path.join(MEDIA_DIR, media.storage_path);
    
    // Generate a unique filename for the optimized version
    const optimizedFileName = `optimized_${path.basename(media.storage_path, path.extname(media.storage_path))}.${format}`;
    const optimizedStoragePath = path.join(path.dirname(media.storage_path), optimizedFileName);
    const optimizedFilePath = path.join(MEDIA_DIR, optimizedStoragePath);
    
    // Optimize with sharp
    let transformer = sharp(filePath);
    
    // Resize if dimensions were provided
    if (width || height) {
      transformer = transformer.resize({
        width: width ? parseInt(width, 10) : undefined,
        height: height ? parseInt(height, 10) : undefined,
        fit: 'inside',
        withoutEnlargement: true,
      });
    }
    
    // Convert and compress
    switch (format.toLowerCase()) {
      case 'jpeg':
      case 'jpg':
        transformer = transformer.jpeg({ quality: parseInt(quality, 10) });
        break;
      case 'png':
        transformer = transformer.png({ quality: parseInt(quality, 10) });
        break;
      case 'webp':
        transformer = transformer.webp({ quality: parseInt(quality, 10) });
        break;
      default:
        transformer = transformer.jpeg({ quality: parseInt(quality, 10) });
    }
    
    // Process and save the optimized file
    await transformer.toFile(optimizedFilePath);
    
    // Get the optimized file size
    const stats = fs.statSync(optimizedFilePath);
    const optimizedSize = stats.size;
    
    // Create the optimized URL
    const baseUrl = process.env.MEDIA_BASE_URL || `${process.env.API_BASE_URL || 'http://localhost:3000'}/uploads/media`;
    const optimizedUrl = `${baseUrl}/${optimizedStoragePath}`;
    
    // Update the media record
    media.status = 'ready';
    media.optimized_url = optimizedUrl;
    media.optimized_size = optimizedSize;
    media.optimization_metadata = {
      quality: parseInt(quality, 10),
      format,
      width: width ? parseInt(width, 10) : undefined,
      height: height ? parseInt(height, 10) : undefined,
      originalSize: media.size,
      compressionRatio: media.size / optimizedSize,
      processedAt: new Date().toISOString(),
    };
    
    await media.save();
    
    return media;
  } catch (error) {
    // If optimization fails, reset status to ready
    media.status = 'ready';
    await media.save();
    
    logger.error('Media optimization error', { error, mediaId: id });
    throw new AppError('Failed to optimize media', 500, 'FILE_004');
  }
};

/**
 * Extract metadata from a file based on its type
 * @param {string} type - The media type
 * @param {string} filePath - Path to the file
 * @param {string} mimetype - The file's mimetype
 * @returns {Promise<Object>} Extracted metadata
 */
async function extractMetadata(type, filePath, mimetype) {
  try {
    const metadata = {};
    
    if (type === 'image') {
      const imageInfo = await sharp(filePath).metadata();
      metadata.width = imageInfo.width;
      metadata.height = imageInfo.height;
      metadata.format = imageInfo.format;
      metadata.space = imageInfo.space;
      metadata.channels = imageInfo.channels;
    }
    
    // For video, document, and audio, we would use appropriate libraries
    // like ffprobe for videos, pdf-parse for PDFs, etc.
    // This is simplified for the example
    
    return metadata;
  } catch (error) {
    logger.warn('Metadata extraction failed', { error, type, filePath });
    return {}; // Return empty metadata if extraction fails
  }
}

/**
 * Generate a thumbnail for an image
 * @param {string} filePath - Path to the image file
 * @param {string} storagePath - Storage path for the original file
 * @returns {Promise<string|null>} Path to the thumbnail or null if failed
 */
async function generateThumbnail(filePath, storagePath) {
  try {
    const thumbnailFileName = `thumb_${path.basename(storagePath)}`;
    const thumbnailStoragePath = path.join(path.dirname(storagePath), thumbnailFileName);
    const thumbnailFilePath = path.join(MEDIA_DIR, thumbnailStoragePath);
    
    await sharp(filePath)
      .resize(200, 200, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(thumbnailFilePath);
      
    return thumbnailStoragePath;
  } catch (error) {
    logger.warn('Thumbnail generation failed', { error, filePath });
    return null;
  }
}

/**
 * Validate and normalize the file type based on mimetype and extension
 * @param {string} mimetype - The file's mimetype
 * @param {string} fileExt - The file extension
 * @param {string} requestedType - The requested media type
 * @returns {string} Validated media type
 */
function validateFileType(mimetype, fileExt, requestedType) {
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  const documentTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv'];
  const videoTypes = ['mp4', 'webm', 'mov', 'avi', 'mkv'];
  const audioTypes = ['mp3', 'wav', 'ogg', 'flac', 'aac'];
  
  const mimeCategory = mimetype.split('/')[0];
  
  // Validate requested type
  if (!['image', 'document', 'video', 'audio'].includes(requestedType)) {
    throw new AppError('Invalid media type', 400, 'VAL_001');
  }
  
  // Validate mimetype matches extension and requested type
  if (
    (requestedType === 'image' && !imageTypes.includes(fileExt)) ||
    (requestedType === 'document' && !documentTypes.includes(fileExt)) ||
    (requestedType === 'video' && !videoTypes.includes(fileExt)) ||
    (requestedType === 'audio' && !audioTypes.includes(fileExt))
  ) {
    throw new AppError('File extension does not match requested media type', 400, 'FILE_002');
  }
  
  // Validate mimetype matches requested type
  if (
    (requestedType === 'image' && mimeCategory !== 'image') ||
    (requestedType === 'video' && mimeCategory !== 'video') ||
    (requestedType === 'audio' && mimeCategory !== 'audio')
  ) {
    throw new AppError('File mimetype does not match requested media type', 400, 'FILE_002');
  }
  
  return requestedType;
}

/**
 * Advanced search for media with multiple filters
 * @param {Object} params Search parameters
 * @returns {Promise<Object>} Search results and pagination info
 */
exports.advancedSearch = async (params) => {
  const {
    userId,
    query,
    type,
    startDate,
    endDate,
    minSize,
    maxSize,
    status,
    optimized,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 20
  } = params;

  const offset = (page - 1) * limit;
  const where = { user_id: userId };

  // Apply search filters
  if (query) {
    where[Sequelize.Op.or] = [
      { filename: { [Sequelize.Op.iLike]: `%${query}%` } },
      { description: { [Sequelize.Op.iLike]: `%${query}%` } }
    ];
  }

  if (type) {
    where.type = type;
  }

  if (startDate || endDate) {
    where.uploaded_at = {};
    if (startDate) {
      where.uploaded_at[Sequelize.Op.gte] = new Date(startDate);
    }
    if (endDate) {
      where.uploaded_at[Sequelize.Op.lte] = new Date(endDate);
    }
  }

  if (minSize) {
    where.size = where.size || {};
    where.size[Sequelize.Op.gte] = minSize;
  }

  if (maxSize) {
    where.size = where.size || {};
    where.size[Sequelize.Op.lte] = maxSize;
  }

  if (status) {
    where.status = status;
  }

  if (optimized !== undefined) {
    if (optimized) {
      where.optimized_url = { [Sequelize.Op.ne]: null };
    } else {
      where.optimized_url = null;
    }
  }

  // Map sort fields to column names
  const sortMapping = {
    uploadedAt: 'uploaded_at',
    createdAt: 'created_at',
    size: 'size',
    filename: 'filename',
    type: 'type'
  };

  const sortField = sortMapping[sortBy] || 'created_at';
  const order = [[sortField, sortOrder.toUpperCase()]];

  // Execute the query
  const { count, rows } = await Media.findAndCountAll({
    where,
    order,
    limit,
    offset
  });

  return {
    media: rows,
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(count / limit)
    }
  };
};

/**
 * Batch delete media files
 * @param {Array<Number>} mediaIds Array of media IDs to delete
 * @param {Number} userId User ID
 * @returns {Promise<Object>} Results of the operation
 */
exports.batchDeleteMedia = async (mediaIds, userId) => {
  const results = {
    success: [],
    failed: []
  };

  // Use transaction to ensure all-or-nothing deletion
  const transaction = await sequelize.transaction();

  try {
    // Find all media owned by this user
    const media = await Media.findAll({
      where: {
        id: { [Sequelize.Op.in]: mediaIds },
        user_id: userId
      }
    });

    // Check if any media doesn't exist
    const foundIds = media.map(item => item.id);
    const notFoundIds = mediaIds.filter(id => !foundIds.includes(id));
    
    // Add not found IDs to failed results
    notFoundIds.forEach(id => {
      results.failed.push({
        id,
        error: 'Media not found or not owned by user'
      });
    });

    // Delete the found media
    for (const item of media) {
      try {
        // Delete the physical file
        await deleteMediaFile(item.storage_provider, item.storage_path);
        
        // Soft delete in database
        await item.destroy({ transaction });
        
        results.success.push({ id: item.id });
      } catch (error) {
        results.failed.push({
          id: item.id,
          error: error.message
        });
      }
    }

    await transaction.commit();
    return results;
  } catch (error) {
    await transaction.rollback();
    throw new AppError(`Batch delete failed: ${error.message}`, 500, 'MEDIA_006');
  }
};

/**
 * Batch optimize media files
 * @param {Array<Number>} mediaIds Array of media IDs to optimize
 * @param {Number} userId User ID
 * @param {Object} options Optimization options
 * @returns {Promise<Object>} Results of the operation
 */
exports.batchOptimizeMedia = async (mediaIds, userId, options) => {
  const results = {
    success: [],
    failed: []
  };

  // Find all media owned by this user
  const media = await Media.findAll({
    where: {
      id: { [Sequelize.Op.in]: mediaIds },
      user_id: userId,
      type: 'image' // Only images can be optimized
    }
  });

  // Check if any media doesn't exist or isn't an image
  const foundIds = media.map(item => item.id);
  const notFoundIds = mediaIds.filter(id => !foundIds.includes(id));
  
  // Add not found IDs to failed results
  notFoundIds.forEach(id => {
    results.failed.push({
      id,
      error: 'Media not found, not owned by user, or not an image'
    });
  });

  // Optimize each found media
  for (const item of media) {
    try {
      const optimizedMedia = await this.optimizeMedia(item.id, userId, options);
      results.success.push({
        id: optimizedMedia.id,
        originalSize: optimizedMedia.size,
        optimizedSize: optimizedMedia.optimized_size,
        compressionRatio: optimizedMedia.size && optimizedMedia.optimized_size ? 
          (1 - (optimizedMedia.optimized_size / optimizedMedia.size)) * 100 : 0
      });
    } catch (error) {
      results.failed.push({
        id: item.id,
        error: error.message
      });
    }
  }

  return results;
};

/**
 * Associate media with another entity
 * @param {Number} mediaId Media ID
 * @param {Number} userId User ID
 * @param {Object} associationData Association data
 * @returns {Promise<Object>} Updated media object
 */
exports.associateMedia = async (mediaId, userId, associationData) => {
  const { entityType, entityId, relationshipType } = associationData;

  // Find the media
  const media = await Media.findOne({
    where: {
      id: mediaId,
      user_id: userId
    }
  });

  if (!media) {
    throw new AppError('Media not found or not owned by user', 404, 'MEDIA_001');
  }

  // Update metadata with association info
  const metadata = { ...media.metadata };
  
  // Initialize associations array if it doesn't exist
  if (!metadata.associations) {
    metadata.associations = [];
  }
  
  // Check if association already exists
  const existingAssociationIndex = metadata.associations.findIndex(
    assoc => assoc.entityType === entityType && assoc.entityId === parseInt(entityId)
  );
  
  if (existingAssociationIndex !== -1) {
    // Update existing association
    metadata.associations[existingAssociationIndex] = {
      entityType,
      entityId: parseInt(entityId),
      relationshipType,
      associatedAt: new Date().toISOString()
    };
  } else {
    // Add new association
    metadata.associations.push({
      entityType,
      entityId: parseInt(entityId),
      relationshipType,
      associatedAt: new Date().toISOString()
    });
  }
  
  // Update media with new metadata
  media.metadata = metadata;
  await media.save();
  
  return media;
};

/**
 * Generate a temporary URL for accessing a media file
 * @param {Number} mediaId Media ID
 * @param {Number} userId User ID
 * @param {Number} expiresIn Expiration time in seconds
 * @returns {Promise<Object>} Temporary URL info
 */
exports.generateTemporaryUrl = async (mediaId, userId, expiresIn = 3600) => {
  // Find the media
  const media = await Media.findOne({
    where: {
      id: mediaId,
      user_id: userId
    }
  });

  if (!media) {
    throw new AppError('Media not found or not owned by user', 404, 'MEDIA_001');
  }

  // For private media or when specifically requested, generate token
  const urlToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + (expiresIn * 1000)); // Convert seconds to milliseconds
  
  // Store token in metadata
  const metadata = { ...media.metadata };
  if (!metadata.temporaryUrls) {
    metadata.temporaryUrls = [];
  }
  
  // Add new token
  metadata.temporaryUrls.push({
    token: urlToken,
    expiresAt: expiresAt.toISOString()
  });
  
  // Clean up expired tokens
  metadata.temporaryUrls = metadata.temporaryUrls.filter(
    item => new Date(item.expiresAt) > new Date()
  );
  
  // Update media with new metadata
  media.metadata = metadata;
  await media.save();
  
  // Generate the temporary URL
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
  const temporaryUrl = `${baseUrl}/api/v1/media/access/${mediaId}?token=${urlToken}`;
  
  return {
    id: media.id,
    temporaryUrl,
    expiresAt
  };
};

/**
 * Validate a media access token
 * @param {Object} media Media object
 * @param {String} token Access token
 * @returns {Promise<Boolean>} Whether the token is valid
 */
exports.validateMediaAccessToken = async (media, token) => {
  if (!media.metadata || !media.metadata.temporaryUrls) {
    return false;
  }
  
  // Find the token in the media's temporaryUrls
  const tokenData = media.metadata.temporaryUrls.find(item => item.token === token);
  
  if (!tokenData) {
    return false;
  }
  
  // Check if token is expired
  const expiresAt = new Date(tokenData.expiresAt);
  const now = new Date();
  
  if (expiresAt <= now) {
    return false;
  }
  
  return true;
};

/**
 * Get a readable stream for a media file
 * @param {Object} media Media object
 * @returns {Promise<Stream>} Readable stream of the file
 */
exports.getMediaFileStream = async (media) => {
  const { storage_provider, storage_path } = media;
  
  // Handle different storage providers
  switch (storage_provider) {
    case 'local':
      // For local storage, create a readable stream from the file
      const fs = require('fs');
      const path = require('path');
      
      const filePath = path.join(MEDIA_DIR, storage_path);
      
      try {
        // Check if file exists
        await fs.promises.access(filePath, fs.constants.R_OK);
        
        // Create and return a readable stream
        return fs.createReadStream(filePath);
      } catch (error) {
        throw new AppError(`File not accessible: ${error.message}`, 404, 'MEDIA_007');
      }
      
    case 's3':
      // For S3 storage, use AWS SDK to get a readable stream
      const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
      
      const s3Client = new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
      });
      
      try {
        const command = new GetObjectCommand({
          Bucket: media.storage_bucket || process.env.AWS_S3_BUCKET,
          Key: storage_path
        });
        
        const response = await s3Client.send(command);
        return response.Body;
      } catch (error) {
        throw new AppError(`S3 file not accessible: ${error.message}`, 404, 'MEDIA_008');
      }
      
    default:
      throw new AppError(`Unsupported storage provider: ${storage_provider}`, 400, 'MEDIA_009');
  }
}; 