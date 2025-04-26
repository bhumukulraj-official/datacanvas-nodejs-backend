class ProfileService {
  async getProfile(userId) {
    const Profile = require('src/modules/profile/models/Profile');
    return await Profile.findOne({
      where: { user_id: userId },
      include: []
    });
  }
  
  async getProfileByUsername(username) {
    const Profile = require('src/modules/profile/models/Profile');
    return await Profile.findOne({
      include: [],
      where: { '$User.username$': username }
    });
  }
  
  async createProfile() {}
  
  async updateProfile(userId, profileData) {
    const Profile = require('src/modules/profile/models/Profile');
    const profile = await Profile.findOne({
      where: { user_id: userId }
    });
    
    if (!profile) {
      throw new Error('Profile not found');
    }
    
    return await profile.update(profileData);
  }
  
  async updateAvatar(userId, fileData) {
    const fs = require('fs/promises');
    const path = require('path');
    const sharp = require('sharp');
    const Profile = require('src/modules/profile/models/Profile');
    
    // Find user profile
    const profile = await Profile.findOne({
      where: { user_id: userId }
    });
    
    if (!profile) {
      throw new Error('Profile not found');
    }
    
    const uploadDir = '/uploads/avatars';
    const fileName = `${userId}-${path.basename(fileData.originalname)}`;
    const filePath = path.join(uploadDir, fileName);
    
    // Create directory if it doesn't exist
    try {
      await fs.access(uploadDir);
    } catch (error) {
      await fs.mkdir(uploadDir, { recursive: true });
    }
    
    // Delete old avatar if exists
    if (profile.avatar_url) {
      try {
        await fs.unlink(profile.avatar_url);
      } catch (error) {
        // Ignore error if file doesn't exist
      }
    }
    
    // Process image with sharp
    await sharp(fileData.path)
      .resize(200, 200)
      .jpeg()
      .toFile(filePath);
    
    // Update profile with new avatar URL
    return await profile.update({
      avatar_url: filePath
    });
  }
  
  async removeAvatar(userId) {
    const fs = require('fs/promises');
    const Profile = require('src/modules/profile/models/Profile');
    
    const profile = await Profile.findOne({
      where: { user_id: userId }
    });
    
    if (!profile) {
      throw new Error('Profile not found');
    }
    
    if (profile.avatar_url) {
      try {
        await fs.unlink(profile.avatar_url);
      } catch (error) {
        // Ignore error if file doesn't exist
      }
    }
    
    return await profile.update({
      avatar_url: null
    });
  }
}

module.exports = ProfileService; 