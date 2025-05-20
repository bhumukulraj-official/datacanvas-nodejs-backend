const BaseRepository = require('../BaseRepository');
const { EmailVerificationToken } = require('../../models');

class EmailVerificationTokenRepository extends BaseRepository {
  constructor() {
    super(EmailVerificationToken);
  }

  async findByToken(token) {
    return this.model.findOne({ where: { token } });
  }

  async deleteForUser(userId) {
    return this.model.destroy({ where: { user_id: userId } });
  }
}

module.exports = EmailVerificationTokenRepository; 