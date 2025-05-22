const BaseRepository = require('../BaseRepository');
const { RefreshToken } = require('../../models');
const { Op } = require('sequelize');

class RefreshTokenRepository extends BaseRepository {
  constructor() {
    super(RefreshToken);
  }

  async findByToken(token) {
    return this.model.findOne({ where: { token } });
  }

  async revokeToken(token) {
    return this.model.update(
      { is_revoked: true },
      { where: { token } }
    );
  }

  async revokeAllForUser(userId) {
    return this.model.update(
      { is_revoked: true },
      { where: { user_id: userId } }
    );
  }

  async getActiveTokensForUser(userId) {
    return this.model.findAll({
      where: {
        user_id: userId,
        is_revoked: false,
        expires_at: { [Op.gt]: new Date() }
      }
    });
  }
}

module.exports = RefreshTokenRepository; 