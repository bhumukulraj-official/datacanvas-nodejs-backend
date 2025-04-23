const profileService = require('../services/profile.service');
const { NotFoundError } = require('../../../shared/errors');
const logger = require('../../../shared/utils/logger');

/**
 * @api {get} /api/v1/profile Get profile
 * @apiName GetProfile
 * @apiGroup Profile
 * @apiVersion 1.0.0
 * 
 * @apiSuccess {Boolean} success Indicates successful operation
 * @apiSuccess {Object} data Profile data
 * @apiSuccess {String} message Success message
 * @apiSuccess {String} timestamp Operation timestamp
 */
exports.getProfile = async (req, res, next) => {
  try {
    // Get user ID from the authenticated user
    const userId = req.user.id;
    
    const profileData = await profileService.getProfileByUserId(userId);
    
    return res.status(200).json({
      success: true,
      data: profileData,
      message: 'Profile retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in getProfile controller', { error: error.message, userId: req.user?.id });
    next(error);
  }
};

/**
 * @api {put} /api/v1/profile Update profile
 * @apiName UpdateProfile
 * @apiGroup Profile
 * @apiVersion 1.0.0
 * 
 * @apiHeader {String} Authorization User's JWT token
 * 
 * @apiParam {Object} personalInfo Personal information
 * @apiParam {String} [personalInfo.title] Professional title (max 100 chars)
 * @apiParam {String} [personalInfo.bio] Biography
 * @apiParam {String} [personalInfo.phone] Phone number (format: +1234567890)
 * @apiParam {String} [personalInfo.location] Location (max 100 chars)
 * @apiParam {String} [personalInfo.website] Personal website URL
 * @apiParam {Object} [socialLinks] Social media links as platform-url pairs
 * 
 * @apiSuccess {Boolean} success Indicates successful operation
 * @apiSuccess {Object} data Updated profile data
 * @apiSuccess {String} message Success message
 * @apiSuccess {String} timestamp Operation timestamp
 */
exports.updateProfile = async (req, res, next) => {
  try {
    // Get user ID from the authenticated user
    const userId = req.user.id;
    
    // Get profile data from request body
    const profileData = req.body;
    
    // Update profile
    const updatedProfile = await profileService.updateProfile(userId, profileData);
    
    return res.status(200).json({
      success: true,
      data: updatedProfile,
      message: 'Profile updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in updateProfile controller', { error: error.message, userId: req.user?.id });
    next(error);
  }
};

/**
 * @api {post} /api/v1/profile/avatar Upload profile avatar
 * @apiName UploadAvatar
 * @apiGroup Profile
 * @apiVersion 1.0.0
 * 
 * @apiHeader {String} Authorization User's JWT token
 * 
 * @apiParam {File} avatar Image file (required, max: 5MB, formats: JPG, PNG, WebP)
 * 
 * @apiSuccess {Boolean} success Indicates successful operation
 * @apiSuccess {Object} data Avatar URLs
 * @apiSuccess {String} data.avatarUrl Full-size avatar URL
 * @apiSuccess {String} data.thumbnailUrl Thumbnail URL
 * @apiSuccess {String} message Success message
 * @apiSuccess {String} timestamp Operation timestamp
 */
exports.uploadAvatar = async (req, res, next) => {
  try {
    // Get user ID from the authenticated user
    const userId = req.user.id;
    
    // File is available in req.file, provided by multer middleware
    const file = req.file;
    
    // Update avatar
    const avatarData = await profileService.updateAvatar(userId, file);
    
    return res.status(200).json({
      success: true,
      data: avatarData,
      message: 'Avatar uploaded successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in uploadAvatar controller', { error: error.message, userId: req.user?.id });
    next(error);
  }
};

/**
 * @api {post} /api/v1/profile/resume Upload resume
 * @apiName UploadResume
 * @apiGroup Profile
 * @apiVersion 1.0.0
 * 
 * @apiHeader {String} Authorization User's JWT token
 * 
 * @apiParam {File} resume Document file (required, max: 10MB, formats: PDF, DOC, DOCX)
 * 
 * @apiSuccess {Boolean} success Indicates successful operation
 * @apiSuccess {Object} data Resume data
 * @apiSuccess {String} data.resumeUrl Resume URL
 * @apiSuccess {String} data.uploadedAt Upload timestamp
 * @apiSuccess {String} message Success message
 * @apiSuccess {String} timestamp Operation timestamp
 */
exports.uploadResume = async (req, res, next) => {
  try {
    // Get user ID from the authenticated user
    const userId = req.user.id;
    
    // File is available in req.file, provided by multer middleware
    const file = req.file;
    
    // Update resume
    const resumeData = await profileService.updateResume(userId, file);
    
    return res.status(200).json({
      success: true,
      data: resumeData,
      message: 'Resume uploaded successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in uploadResume controller', { error: error.message, userId: req.user?.id });
    next(error);
  }
};

/**
 * @api {delete} /api/v1/profile/avatar Delete profile avatar
 * @apiName DeleteAvatar
 * @apiGroup Profile
 * @apiVersion 1.0.0
 * 
 * @apiHeader {String} Authorization User's JWT token
 * 
 * @apiSuccess {Boolean} success Indicates successful operation
 * @apiSuccess {Object} data Empty object
 * @apiSuccess {String} message Success message
 * @apiSuccess {String} timestamp Operation timestamp
 */
exports.deleteAvatar = async (req, res, next) => {
  try {
    // Get user ID from the authenticated user
    const userId = req.user.id;
    
    // Delete avatar
    await profileService.deleteAvatar(userId);
    
    return res.status(200).json({
      success: true,
      data: {},
      message: 'Avatar deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in deleteAvatar controller', { error: error.message, userId: req.user?.id });
    next(error);
  }
};

/**
 * @api {delete} /api/v1/profile/resume Delete resume
 * @apiName DeleteResume
 * @apiGroup Profile
 * @apiVersion 1.0.0
 * 
 * @apiHeader {String} Authorization User's JWT token
 * 
 * @apiSuccess {Boolean} success Indicates successful operation
 * @apiSuccess {Object} data Empty object
 * @apiSuccess {String} message Success message
 * @apiSuccess {String} timestamp Operation timestamp
 */
exports.deleteResume = async (req, res, next) => {
  try {
    // Get user ID from the authenticated user
    const userId = req.user.id;
    
    // Delete resume
    await profileService.deleteResume(userId);
    
    return res.status(200).json({
      success: true,
      data: {},
      message: 'Resume deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in deleteResume controller', { error: error.message, userId: req.user?.id });
    next(error);
  }
};

/**
 * @api {get} /api/v1/profiles/:username Get public profile
 * @apiName GetPublicProfile
 * @apiGroup Profile
 * @apiVersion 1.0.0
 * 
 * @apiParam {String} username Username to fetch profile for
 * 
 * @apiSuccess {Boolean} success Indicates successful operation
 * @apiSuccess {Object} data Profile data
 * @apiSuccess {String} message Success message
 * @apiSuccess {String} timestamp Operation timestamp
 */
exports.getPublicProfile = async (req, res, next) => {
  try {
    // Get username from request parameters
    const { username } = req.params;
    
    // Get public profile data
    const profileData = await profileService.getPublicProfileByUsername(username);
    
    return res.status(200).json({
      success: true,
      data: profileData,
      message: 'Public profile retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in getPublicProfile controller', { error: error.message, username: req.params.username });
    next(error);
  }
};

/**
 * @api {get} /api/v1/profile/availability/:username Check username availability
 * @apiName CheckUsernameAvailability
 * @apiGroup Profile
 * @apiVersion 1.0.0
 * 
 * @apiParam {String} username Username to check
 * 
 * @apiSuccess {Boolean} success Indicates successful operation
 * @apiSuccess {Object} data Availability data
 * @apiSuccess {Boolean} data.isAvailable Whether the username is available
 * @apiSuccess {Array} [data.suggestions] Alternative username suggestions if not available
 * @apiSuccess {String} message Success message
 * @apiSuccess {String} timestamp Operation timestamp
 */
exports.checkUsernameAvailability = async (req, res, next) => {
  try {
    // Get username from request parameters
    const { username } = req.params;
    
    // Check availability
    const availabilityData = await profileService.checkUsernameAvailability(username);
    
    return res.status(200).json({
      success: true,
      data: availabilityData,
      message: availabilityData.isAvailable 
        ? 'Username is available' 
        : 'Username is already taken',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in checkUsernameAvailability controller', { 
      error: error.message, 
      username: req.params?.username 
    });
    next(error);
  }
}; 