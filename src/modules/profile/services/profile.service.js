const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { NotFoundError, ValidationError } = require('../../../shared/errors');
const cache = require('../../../shared/utils/cache');
const config = require('../../../shared/config');
const logger = require('../../../shared/utils/logger');
const Profile = require('../models/Profile');
const User = require('../../auth/models/User'); // Import User model for joined operations
const sequelize = require('../../../shared/database').sequelize; // For transactions

/**
 * Get user profile by user ID
 * @param {number} userId - User ID
 * @returns {Promise<Object>} User profile data
 */
exports.getProfileByUserId = async (userId) => {
  try {
    // Get both profile and user data (addressing data consistency)
    const [profile, user] = await Promise.all([
      Profile.findOne({
        where: { user_id: userId }
      }),
      User.findOne({
        where: { id: userId },
        attributes: ['id', 'username', 'first_name', 'last_name', 'email', 'bio', 'avatar']
      })
    ]);
    
    if (!profile || !user) {
      throw new NotFoundError('Profile not found');
    }
    
    // Format the response with consistent data (combining user and profile data)
    return {
      personalInfo: {
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        title: profile.title,
        bio: profile.bio || user.bio, // Use profile bio first, fallback to user bio
        avatar: profile.avatar_url || user.avatar, // Use profile avatar first, fallback to user avatar
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
  const transaction = await sequelize.transaction();
  
  try {
    // Get existing profile and user data
    const [profile, user] = await Promise.all([
      Profile.findOne({
        where: { user_id: userId },
        transaction
      }),
      User.findOne({
        where: { id: userId },
        transaction
      })
    ]);
    
    if (!profile) {
      await transaction.rollback();
      throw new NotFoundError('Profile not found');
    }
    
    if (!user) {
      await transaction.rollback();
      throw new NotFoundError('User not found');
    }
    
    // Update profile fields with proper field mapping
    const updateProfileData = {
      title: profileData.personalInfo?.title !== undefined ? profileData.personalInfo.title : profile.title,
      bio: profileData.personalInfo?.bio !== undefined ? profileData.personalInfo.bio : profile.bio,
      phone: profileData.personalInfo?.phone !== undefined ? profileData.personalInfo.phone : profile.phone,
      location: profileData.personalInfo?.location !== undefined ? profileData.personalInfo.location : profile.location,
      website: profileData.personalInfo?.website !== undefined ? profileData.personalInfo.website : profile.website,
      social_links: profileData.socialLinks || profile.social_links
    };
    
    await profile.update(updateProfileData, { transaction });
    
    // Also update matching fields in User model for consistency
    if (profileData.personalInfo?.bio !== undefined) {
      await user.update({ bio: profileData.personalInfo.bio }, { transaction });
    }
    
    await transaction.commit();
    
    // Invalidate cache
    await cache.del(`profiles:${userId}`);
    
    return this.getProfileByUserId(userId);
  } catch (error) {
    await transaction.rollback();
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
  const transaction = await sequelize.transaction();
  
  try {
    const [profile, user] = await Promise.all([
      Profile.findOne({
        where: { user_id: userId },
        transaction
      }),
      User.findOne({
        where: { id: userId },
        transaction
      })
    ]);
    
    if (!profile) {
      await transaction.rollback();
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
    }, { transaction });
    
    // Also update User model avatar for consistency
    if (user) {
      await user.update({
        avatar: avatarUrl
      }, { transaction });
    }
    
    await transaction.commit();
    
    // Invalidate cache
    await cache.del(`profiles:${userId}`);
    
    return {
      avatarUrl,
      thumbnailUrl
    };
  } catch (error) {
    await transaction.rollback();
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
  const transaction = await sequelize.transaction();
  
  try {
    const profile = await Profile.findOne({
      where: { user_id: userId },
      transaction
    });
    
    if (!profile) {
      await transaction.rollback();
      throw new NotFoundError('Profile not found');
    }
    
    // Generate paths
    const resumePath = file.path;
    const resumeFilename = file.filename;
    
    // Calculate URL
    const baseUrl = config.app.url || 'http://localhost:3000';
    const resumeUrl = `${baseUrl}/uploads/resumes/${resumeFilename}`;
    
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
    }, { transaction });
    
    await transaction.commit();
    
    // Invalidate cache
    await cache.del(`profiles:${userId}`);
    
    return {
      resumeUrl,
      uploadedAt: new Date().toISOString(),
      fileType: file.mimetype,
      fileSize: file.size
    };
  } catch (error) {
    await transaction.rollback();
    logger.error('Error updating resume', { userId, error: error.message });
    throw error;
  }
};

/**
 * Delete avatar
 * @param {number} userId - User ID
 * @returns {Promise<void>}
 */
exports.deleteAvatar = async (userId) => {
  const transaction = await sequelize.transaction();
  
  try {
    const [profile, user] = await Promise.all([
      Profile.findOne({
        where: { user_id: userId },
        transaction
      }),
      User.findOne({
        where: { id: userId },
        transaction
      })
    ]);
    
    if (!profile) {
      await transaction.rollback();
      throw new NotFoundError('Profile not found');
    }
    
    // Only proceed if there's an avatar to delete
    if (profile.avatar_url) {
      // Delete the file
      const baseUrl = config.app.url || 'http://localhost:3000';
      const avatarPath = profile.avatar_url.replace(`${baseUrl}/uploads/`, path.join(process.cwd(), 'uploads/'));
      
      try {
        if (fs.existsSync(avatarPath)) {
          fs.unlinkSync(avatarPath);
        }
        
        // Also try to delete thumbnail
        const filename = path.basename(avatarPath);
        const thumbFilename = `thumb_${filename}`;
        const thumbPath = path.join(path.dirname(avatarPath), thumbFilename);
        
        if (fs.existsSync(thumbPath)) {
          fs.unlinkSync(thumbPath);
        }
      } catch (error) {
        logger.error(`Error deleting avatar file: ${error.message}`, { userId, avatarPath });
        // Continue execution even if file deletion fails
      }
      
      // Update profile to remove avatar reference
      await profile.update({
        avatar_url: null
      }, { transaction });
      
      // Also update User model for consistency
      if (user) {
        await user.update({
          avatar: null
        }, { transaction });
      }
    }
    
    await transaction.commit();
    
    // Invalidate cache
    await cache.del(`profiles:${userId}`);
    
    return true;
  } catch (error) {
    await transaction.rollback();
    logger.error('Error deleting avatar', { userId, error: error.message });
    throw error;
  }
};

/**
 * Delete resume
 * @param {number} userId - User ID
 * @returns {Promise<void>}
 */
exports.deleteResume = async (userId) => {
  const transaction = await sequelize.transaction();
  
  try {
    const profile = await Profile.findOne({
      where: { user_id: userId },
      transaction
    });
    
    if (!profile) {
      await transaction.rollback();
      throw new NotFoundError('Profile not found');
    }
    
    // Only proceed if there's a resume to delete
    if (profile.resume_url) {
      // Delete the file
      const baseUrl = config.app.url || 'http://localhost:3000';
      const resumePath = profile.resume_url.replace(`${baseUrl}/uploads/`, path.join(process.cwd(), 'uploads/'));
      
      try {
        if (fs.existsSync(resumePath)) {
          fs.unlinkSync(resumePath);
        }
      } catch (error) {
        logger.error(`Error deleting resume file: ${error.message}`, { userId, resumePath });
        // Continue execution even if file deletion fails
      }
      
      // Update profile to remove resume reference
      await profile.update({
        resume_url: null
      }, { transaction });
    }
    
    await transaction.commit();
    
    // Invalidate cache
    await cache.del(`profiles:${userId}`);
    
    return true;
  } catch (error) {
    await transaction.rollback();
    logger.error('Error deleting resume', { userId, error: error.message });
    throw error;
  }
};

/**
 * Get public profile by username
 * @param {string} username - Username
 * @returns {Promise<Object>} Public profile data
 */
exports.getPublicProfileByUsername = async (username) => {
  try {
    // Get user by username
    const user = await User.findOne({
      where: { 
        username,
        status: 'active' // Only return active users
      },
      attributes: ['id', 'username', 'first_name', 'last_name', 'bio', 'avatar']
    });
    
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    // Get profile
    const profile = await Profile.findOne({
      where: { user_id: user.id }
    });
    
    if (!profile) {
      throw new NotFoundError('Profile not found');
    }
    
    // Return public information only
    return {
      personalInfo: {
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        title: profile.title,
        bio: profile.bio || user.bio, // Use profile bio first, fallback to user bio
        avatar: profile.avatar_url || user.avatar, // Use profile avatar first, fallback to user avatar
        location: profile.location,
        website: profile.website
      },
      socialLinks: profile.social_links || {}
      // Note: Not including phone, email, or resume in public profile for privacy
    };
  } catch (error) {
    logger.error('Error fetching public profile', { username, error: error.message });
    throw error;
  }
};

/**
 * Check if a username is available
 * @param {string} username - Username to check
 * @returns {Promise<Object>} Availability status
 */
exports.checkUsernameAvailability = async (username) => {
  try {
    // Get user by username
    const user = await User.findOne({
      where: { username },
      attributes: ['id']
    });
    
    const isAvailable = !user;
    
    // Return availability information with suggestions if not available
    if (!isAvailable) {
      // Generate suggestions by adding numbers or underscores
      const suggestions = [];
      for (let i = 1; i <= 3; i++) {
        suggestions.push(`${username}${i}`);
        suggestions.push(`${username}_${i}`);
      }
      
      return {
        isAvailable,
        suggestions
      };
    }
    
    return { isAvailable };
  } catch (error) {
    logger.error('Error checking username availability', { username, error: error.message });
    throw error;
  }
};

// Apply caching to getProfileByUserId
const originalGetProfileByUserId = exports.getProfileByUserId;
exports.getProfileByUserId = cache.cacheWrapper(
  originalGetProfileByUserId,
  (userId) => `profiles:${userId}`,
  60 * 5 // Cache for 5 minutes
);

// Apply caching to getPublicProfileByUsername
exports.getPublicProfileByUsername = cache.cacheWrapper(
  exports.getPublicProfileByUsername,
  (username) => `profiles:public:${username}`,
  60 * 15 // Cache for 15 minutes
); 