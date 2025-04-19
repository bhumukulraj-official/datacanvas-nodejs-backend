const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { NotFoundError, ValidationError } = require('../../../shared/errors');
const cache = require('../../../shared/utils/cache');
const config = require('../../../shared/config');
const logger = require('../../../shared/utils/logger');

/**
 * Get user profile by user ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User profile data
 */
exports.getProfileByUserId = async (userId) => {
  const { Profile } = require('../../../shared/database/models');
  
  const profile = await Profile.findOne({
    where: { userId }
  });
  
  if (!profile) {
    throw new NotFoundError('Profile not found');
  }
  
  // Format the response according to API specification
  return {
    personalInfo: {
      name: profile.name,
      title: profile.title,
      bio: profile.bio,
      avatar: profile.avatar,
      email: profile.email,
      phone: profile.phone,
      location: profile.location
    },
    socialLinks: profile.socialLinks || [],
    resume: profile.resume
  };
};

/**
 * Create profile for a user
 * @param {string} userId - User ID
 * @param {Object} profileData - Profile data
 * @returns {Promise<Object>} Created profile
 */
exports.createProfile = async (userId, profileData) => {
  const { Profile } = require('../../../shared/database/models');
  
  // Check if profile already exists
  const existingProfile = await Profile.findOne({
    where: { userId }
  });
  
  if (existingProfile) {
    throw new ValidationError('Profile already exists for this user');
  }
  
  // Create profile
  const profile = await Profile.create({
    userId,
    name: profileData.personalInfo.name,
    title: profileData.personalInfo.title,
    bio: profileData.personalInfo.bio,
    email: profileData.personalInfo.email,
    phone: profileData.personalInfo.phone,
    location: profileData.personalInfo.location,
    socialLinks: profileData.socialLinks || []
  });
  
  // Invalidate cache
  await cache.del(`profiles:${userId}`);
  
  return this.getProfileByUserId(userId);
};

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {Object} profileData - Updated profile data
 * @returns {Promise<Object>} Updated profile
 */
exports.updateProfile = async (userId, profileData) => {
  const { Profile } = require('../../../shared/database/models');
  
  const profile = await Profile.findOne({
    where: { userId }
  });
  
  if (!profile) {
    throw new NotFoundError('Profile not found');
  }
  
  // Update profile fields
  await profile.update({
    name: profileData.personalInfo.name,
    title: profileData.personalInfo.title,
    bio: profileData.personalInfo.bio,
    email: profileData.personalInfo.email,
    phone: profileData.personalInfo.phone,
    location: profileData.personalInfo.location,
    socialLinks: profileData.socialLinks || profile.socialLinks
  });
  
  // Invalidate cache
  await cache.del(`profiles:${userId}`);
  
  return this.getProfileByUserId(userId);
};

/**
 * Upload and update profile avatar
 * @param {string} userId - User ID
 * @param {Object} file - Uploaded file
 * @returns {Promise<Object>} Avatar URLs
 */
exports.updateAvatar = async (userId, file) => {
  const { Profile } = require('../../../shared/database/models');
  
  const profile = await Profile.findOne({
    where: { userId }
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
  if (profile.avatar) {
    const oldAvatarPath = profile.avatar.replace(`${baseUrl}/uploads/`, path.join(process.cwd(), 'uploads/'));
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
    avatar: avatarUrl
  });
  
  // Invalidate cache
  await cache.del(`profiles:${userId}`);
  
  return {
    avatarUrl,
    thumbnailUrl
  };
};

/**
 * Upload and update resume
 * @param {string} userId - User ID
 * @param {Object} file - Uploaded file
 * @returns {Promise<Object>} Resume URL and upload timestamp
 */
exports.updateResume = async (userId, file) => {
  const { Profile } = require('../../../shared/database/models');
  
  const profile = await Profile.findOne({
    where: { userId }
  });
  
  if (!profile) {
    throw new NotFoundError('Profile not found');
  }
  
  // Calculate resume URL
  const baseUrl = config.app.url || 'http://localhost:3000';
  const resumeUrl = `${baseUrl}/uploads/resumes/${file.filename}`;
  
  // Delete old resume if exists
  if (profile.resume) {
    const oldResumePath = profile.resume.replace(`${baseUrl}/uploads/`, path.join(process.cwd(), 'uploads/'));
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
    resume: resumeUrl
  });
  
  // Invalidate cache
  await cache.del(`profiles:${userId}`);
  
  return {
    resumeUrl,
    uploadedAt: new Date().toISOString()
  };
};

// Apply caching to getProfileByUserId
exports.getProfileByUserId = cache.cacheWrapper(
  exports.getProfileByUserId,
  'profiles',
  7200 // 2 hours TTL
); 