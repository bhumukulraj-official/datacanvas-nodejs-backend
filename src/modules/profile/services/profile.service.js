const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { NotFoundError, ValidationError } = require('../../../shared/errors');
const cache = require('../../../shared/utils/cache');
const config = require('../../../shared/config');
const logger = require('../../../shared/utils/logger');
const Profile = require('../models/Profile');

/**
 * Get user profile by user ID
 * @param {number} userId - User ID
 * @returns {Promise<Object>} User profile data
 */
exports.getProfileByUserId = async (userId) => {
  try {
    const profile = await Profile.findOne({
      where: { user_id: userId }
    });
    
    if (!profile) {
      throw new NotFoundError('Profile not found');
    }
    
    // Format the response according to API specification
    return {
      personalInfo: {
        title: profile.title,
        bio: profile.bio,
        avatar: profile.avatar_url,
        phone: profile.phone,
        location: profile.location,
        website: profile.website
      },
      socialLinks: profile.social_links || {},
      resume: profile.resume_url
    };
  } catch (error) {
    logger.error('Error fetching profile', { userId, error: error.message });
    throw error;
  }
};

/**
 * Create profile for a user
 * @param {number} userId - User ID
 * @param {Object} profileData - Profile data
 * @returns {Promise<Object>} Created profile
 */
exports.createProfile = async (userId, profileData) => {
  try {
    // Check if profile already exists
    const existingProfile = await Profile.findOne({
      where: { user_id: userId }
    });
    
    if (existingProfile) {
      throw new ValidationError('Profile already exists for this user');
    }
    
    // Create profile with proper field mapping
    const profile = await Profile.create({
      user_id: userId,
      title: profileData.personalInfo?.title,
      bio: profileData.personalInfo?.bio,
      avatar_url: profileData.personalInfo?.avatar,
      phone: profileData.personalInfo?.phone,
      location: profileData.personalInfo?.location,
      website: profileData.personalInfo?.website,
      social_links: profileData.socialLinks || {},
      resume_url: profileData.resume
    });
    
    // Invalidate cache
    await cache.del(`profiles:${userId}`);
    
    return this.getProfileByUserId(userId);
  } catch (error) {
    logger.error('Error creating profile', { userId, error: error.message });
    throw error;
  }
};

/**
 * Update user profile
 * @param {number} userId - User ID
 * @param {Object} profileData - Updated profile data
 * @returns {Promise<Object>} Updated profile
 */
exports.updateProfile = async (userId, profileData) => {
  try {
    const profile = await Profile.findOne({
      where: { user_id: userId }
    });
    
    if (!profile) {
      throw new NotFoundError('Profile not found');
    }
    
    // Update profile fields with proper field mapping
    const updateData = {
      title: profileData.personalInfo?.title !== undefined ? profileData.personalInfo.title : profile.title,
      bio: profileData.personalInfo?.bio !== undefined ? profileData.personalInfo.bio : profile.bio,
      phone: profileData.personalInfo?.phone !== undefined ? profileData.personalInfo.phone : profile.phone,
      location: profileData.personalInfo?.location !== undefined ? profileData.personalInfo.location : profile.location,
      website: profileData.personalInfo?.website !== undefined ? profileData.personalInfo.website : profile.website,
      social_links: profileData.socialLinks || profile.social_links
    };
    
    await profile.update(updateData);
    
    // Invalidate cache
    await cache.del(`profiles:${userId}`);
    
    return this.getProfileByUserId(userId);
  } catch (error) {
    logger.error('Error updating profile', { userId, error: error.message });
    throw error;
  }
};

/**
 * Upload and update profile avatar
 * @param {number} userId - User ID
 * @param {Object} file - Uploaded file
 * @returns {Promise<Object>} Avatar URLs
 */
exports.updateAvatar = async (userId, file) => {
  try {
    const profile = await Profile.findOne({
      where: { user_id: userId }
    });
    
    if (!profile) {
      throw new NotFoundError('Profile not found');
    }
    
    // Generate paths
    const avatarPath = file.path;
    const avatarFilename = file.filename;
    const thumbnailFilename = `thumb_${avatarFilename}`;
    const thumbnailPath = path.join(path.dirname(avatarPath), thumbnailFilename);
    
    // Create thumbnail with sharp
    try {
      await sharp(avatarPath)
        .resize(200, 200)
        .jpeg({ quality: 90 })
        .toFile(thumbnailPath);
    } catch (error) {
      logger.error(`Error creating thumbnail: ${error.message}`, { userId, filename: avatarFilename });
      // Continue even if thumbnail creation fails
    }
    
    // Calculate URLs (in a real app, this would be your CDN or storage base URL)
    const baseUrl = config.app.url || 'http://localhost:3000';
    const avatarUrl = `${baseUrl}/uploads/avatars/${avatarFilename}`;
    const thumbnailUrl = `${baseUrl}/uploads/avatars/${thumbnailFilename}`;
    
    // Delete old avatar if exists
    if (profile.avatar_url) {
      const oldAvatarPath = profile.avatar_url.replace(`${baseUrl}/uploads/`, path.join(process.cwd(), 'uploads/'));
      try {
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
        
        // Also try to delete old thumbnail
        const oldThumbPath = oldAvatarPath.replace(path.basename(oldAvatarPath), `thumb_${path.basename(oldAvatarPath)}`);
        if (fs.existsSync(oldThumbPath)) {
          fs.unlinkSync(oldThumbPath);
        }
      } catch (error) {
        logger.error(`Error deleting old avatar: ${error.message}`, { userId, oldPath: oldAvatarPath });
        // Continue execution even if deletion fails
      }
    }
    
    // Update profile with new avatar URL
    await profile.update({
      avatar_url: avatarUrl
    });
    
    // Invalidate cache
    await cache.del(`profiles:${userId}`);
    
    return {
      avatarUrl,
      thumbnailUrl
    };
  } catch (error) {
    logger.error('Error updating avatar', { userId, error: error.message });
    throw error;
  }
};

/**
 * Upload and update resume
 * @param {number} userId - User ID
 * @param {Object} file - Uploaded file
 * @returns {Promise<Object>} Resume URL and upload timestamp
 */
exports.updateResume = async (userId, file) => {
  try {
    const profile = await Profile.findOne({
      where: { user_id: userId }
    });
    
    if (!profile) {
      throw new NotFoundError('Profile not found');
    }
    
    // Calculate resume URL
    const baseUrl = config.app.url || 'http://localhost:3000';
    const resumeUrl = `${baseUrl}/uploads/resumes/${file.filename}`;
    
    // Delete old resume if exists
    if (profile.resume_url) {
      const oldResumePath = profile.resume_url.replace(`${baseUrl}/uploads/`, path.join(process.cwd(), 'uploads/'));
      try {
        if (fs.existsSync(oldResumePath)) {
          fs.unlinkSync(oldResumePath);
        }
      } catch (error) {
        logger.error(`Error deleting old resume: ${error.message}`, { userId, oldPath: oldResumePath });
        // Continue execution even if deletion fails
      }
    }
    
    // Update profile with new resume URL
    await profile.update({
      resume_url: resumeUrl
    });
    
    // Invalidate cache
    await cache.del(`profiles:${userId}`);
    
    return {
      resumeUrl,
      uploadedAt: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Error updating resume', { userId, error: error.message });
    throw error;
  }
};

// Apply caching to getProfileByUserId
exports.getProfileByUserId = cache.cacheWrapper(
  exports.getProfileByUserId,
  'profiles',
  7200 // 2 hours TTL
); 