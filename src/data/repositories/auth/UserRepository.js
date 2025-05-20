const BaseRepository = require('../BaseRepository');
const { User } = require('../../models');

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email) {
    return this.model.findOne({ where: { email } });
  }

  async verifyEmail(userId) {
    return this.update(userId, { email_verified: true });
  }

  async updatePassword(userId, passwordHash) {
    return this.update(userId, { password_hash: passwordHash });
  }

  async getWithRoles(userId) {
    return this.model.findByPk(userId, {
      include: ['UserRole']
    });
  }
}

module.exports = UserRepository; 