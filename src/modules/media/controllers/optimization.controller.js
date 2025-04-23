/**
 * Media Optimization Controller
 * Handles HTTP requests for media optimization operations
 */
const { optimizationService } = require('../services');
const { catchAsync } = require('../../../shared/utils');

/**
 * Optimize a media item
 */
exports.optimizeMedia = catchAsync(async (req, res) => {
  const { id } = req.params;
  const options = req.body;
  
  const media = await optimizationService.optimizeMedia(id, options);
  
  res.status(200).json({
    success: true,
    data: {
      id: media.id,
      original_url: media.url,
      optimized_url: media.optimized_url,
      original_size: media.size,
      optimized_size: media.optimized_size,
      size_reduction: media.size ? Math.round((1 - (media.optimized_size / media.size)) * 100) : 0,
      optimized_width: media.optimized_width,
      optimized_height: media.optimized_height,
      optimized_format: media.optimized_format
    }
  });
});

/**
 * Optimize an image with specific options
 */
exports.optimizeImage = catchAsync(async (req, res) => {
  const { id } = req.params;
  const options = req.body;
  
  const media = await optimizationService.optimizeImage(id, options);
  
  res.status(200).json({
    success: true,
    data: {
      id: media.id,
      original_url: media.url,
      optimized_url: media.optimized_url,
      original_size: media.size,
      optimized_size: media.optimized_size,
      size_reduction: media.size ? Math.round((1 - (media.optimized_size / media.size)) * 100) : 0,
      original_width: media.width,
      original_height: media.height,
      optimized_width: media.optimized_width,
      optimized_height: media.optimized_height,
      optimized_format: media.optimized_format
    }
  });
});

/**
 * Get optimization status of a media item
 */
exports.getOptimizationStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  const media = await optimizationService.getMedia(id);
  
  const isOptimized = !!media.optimized_url;
  
  res.status(200).json({
    success: true,
    data: {
      id: media.id,
      is_optimized: isOptimized,
      original_url: media.url,
      optimized_url: media.optimized_url,
      original_size: media.size,
      optimized_size: media.optimized_size,
      size_reduction: media.size && media.optimized_size ? 
        Math.round((1 - (media.optimized_size / media.size)) * 100) : 0,
      original_width: media.width,
      original_height: media.height,
      optimized_width: media.optimized_width,
      optimized_height: media.optimized_height,
      optimized_format: media.optimized_format
    }
  });
}); 