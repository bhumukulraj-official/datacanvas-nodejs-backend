/**
 * Media Optimization Service
 * Handles business logic for media optimization operations
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const { Media } = require('../models');
const { BadRequestError, NotFoundError } = require('../../../shared/errors');
const { uploadToStorage } = require('../../../shared/services/storage.service');
const config = require('../../../config');

/**
 * Get media by ID
 */
exports.getMedia = async (id) => {
  const media = await Media.findByPk(id);
  
  if (!media) {
    throw new NotFoundError('Media not found');
  }
  
  return media;
};

/**
 * Optimize an image
 */
exports.optimizeImage = async (mediaId, options = {}) => {
  // Get the media record
  const media = await Media.findByPk(mediaId);
  
  if (!media) {
    throw new NotFoundError('Media not found');
  }
  
  // Check if it's an image
  if (!media.mime_type.startsWith('image/')) {
    throw new BadRequestError('Media is not an image');
  }
  
  // Check if already optimized
  if (media.optimized_url) {
    return media;
  }
  
  // Set default options
  const {
    width = null,
    height = null,
    quality = 80,
    format = 'webp',
    crop = false
  } = options;
  
  try {
    // Download the file from the original URL
    const response = await fetch(media.url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Create a temporary file path
    const tempDir = path.join(config.tempDir, 'optimizations');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const tempFilePath = path.join(tempDir, `${uuidv4()}.${format}`);
    
    // Process the image with Sharp
    let sharpInstance = sharp(buffer);
    
    // Apply resizing
    if (width || height) {
      const resizeOptions = {
        width: width || undefined,
        height: height || undefined,
        fit: crop ? 'cover' : 'inside',
        withoutEnlargement: true
      };
      
      sharpInstance = sharpInstance.resize(resizeOptions);
    }
    
    // Set format and quality
    if (format === 'webp') {
      sharpInstance = sharpInstance.webp({ quality });
    } else if (format === 'jpeg' || format === 'jpg') {
      sharpInstance = sharpInstance.jpeg({ quality });
    } else if (format === 'png') {
      sharpInstance = sharpInstance.png({ quality });
    } else if (format === 'avif') {
      sharpInstance = sharpInstance.avif({ quality });
    }
    
    // Write the optimized image to the temporary file
    await sharpInstance.toFile(tempFilePath);
    
    // Get file size and dimensions
    const stats = fs.statSync(tempFilePath);
    const optimizedSize = stats.size;
    const metadata = await sharp(tempFilePath).metadata();
    
    // Upload the optimized file
    const optimizedFileName = `optimized/${media.user_id}/${path.basename(media.file_name, path.extname(media.file_name))}_optimized.${format}`;
    const uploadResult = await uploadToStorage(tempFilePath, optimizedFileName, `image/${format}`);
    
    // Delete temporary file
    fs.unlinkSync(tempFilePath);
    
    // Update the media record
    await media.update({
      optimized_url: uploadResult.url,
      optimized_size: optimizedSize,
      optimized_width: metadata.width,
      optimized_height: metadata.height,
      optimized_format: format
    });
    
    return media;
  } catch (error) {
    throw new Error(`Failed to optimize image: ${error.message}`);
  }
};

/**
 * Optimize a video
 * (This would typically use a video processing library or service)
 */
exports.optimizeVideo = async (mediaId, options = {}) => {
  // Get the media record
  const media = await Media.findByPk(mediaId);
  
  if (!media) {
    throw new NotFoundError('Media not found');
  }
  
  // Check if it's a video
  if (!media.mime_type.startsWith('video/')) {
    throw new BadRequestError('Media is not a video');
  }
  
  // Check if already optimized
  if (media.optimized_url) {
    return media;
  }
  
  // Video optimization would typically be done with a library like FFmpeg
  // or by sending to a video processing service
  throw new Error('Video optimization is not implemented yet');
};

/**
 * Optimize any media based on its type
 */
exports.optimizeMedia = async (mediaId, options = {}) => {
  // Get the media record
  const media = await Media.findByPk(mediaId);
  
  if (!media) {
    throw new NotFoundError('Media not found');
  }
  
  // Optimize based on media type
  if (media.mime_type.startsWith('image/')) {
    return this.optimizeImage(mediaId, options);
  } else if (media.mime_type.startsWith('video/')) {
    return this.optimizeVideo(mediaId, options);
  } else {
    throw new BadRequestError('Media type cannot be optimized');
  }
}; 