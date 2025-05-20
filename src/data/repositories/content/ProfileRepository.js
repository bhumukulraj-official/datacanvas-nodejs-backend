const BaseRepository = require('../BaseRepository');
const { Profile } = require('../../models');

class ProfileRepository extends BaseRepository {
  constructor() {
    super(Profile);
  }

  async getByUserId(userId) {
    return this.model.findOne({ where: { user_id: userId } });
  }

  async updateSocialLinks(userId, socialLinks) {
    return this.model.update(
      { social_links: socialLinks },
      { where: { user_id: userId } }
    );
  }

  async updateSocialLink(userId, platform, url) {
    const profile = await this.getByUserId(userId);
    const socialLinks = profile.social_links || [];
    
    const updatedLinks = socialLinks.filter(link => 
      link.platform !== platform
    ).concat({ platform, url });

    return this.update(profile.id, { social_links: updatedLinks });
  }
}

module.exports = ProfileRepository; 