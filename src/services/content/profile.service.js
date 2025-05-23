const { ProfileRepository } = require('../../../data/repositories/content');
const { CustomError } = require('../../utils/error.util');

class ProfileService {
  constructor() {
    this.profileRepo = new ProfileRepository();
  }

  async getProfile(userId) {
    const profile = await this.profileRepo.getByUserId(userId);
    if (!profile) {
      throw new CustomError('Profile not found', 404);
    }
    return profile;
  }

  async updateSocialLinks(userId, links) {
    const validPlatforms = ['github', 'linkedin', 'twitter', 'personal'];
    const invalid = Object.keys(links).filter(p => !validPlatforms.includes(p));
    
    if (invalid.length > 0) {
      throw new CustomError(`Invalid platforms: ${invalid.join(', ')}`, 400);
    }

    const [affectedCount] = await this.profileRepo.updateSocialLinks(userId, links);
    if (affectedCount === 0) {
      throw new CustomError('Profile not found', 404);
    }
    
    return this.getProfile(userId);
  }

  async updateBio(userId, bio) {
    const [affectedCount] = await this.profileRepo.update(
      { user_id: userId },
      { bio }
    );
    
    if (affectedCount === 0) {
      throw new CustomError('Profile not found', 404);
    }
    
    return this.getProfile(userId);
  }
}

module.exports = new ProfileService(); 