const BaseRepository = require('../BaseRepository');
const { ClientInvitation } = require('../../models');
const { Op } = require('sequelize');

class ClientInvitationRepository extends BaseRepository {
  constructor() {
    super(ClientInvitation);
  }

  async findByToken(invitationToken) {
    return this.model.findOne({ where: { invitation_token: invitationToken } });
  }

  async findByEmail(email) {
    return this.model.findAll({ where: { email } });
  }

  async findValidInvitation(invitationToken) {
    return this.model.findOne({
      where: {
        invitation_token: invitationToken,
        is_accepted: false,
        is_revoked: false,
        expires_at: { [Op.gt]: new Date() },
        used_count: { [Op.lt]: this.model.sequelize.col('max_uses') }
      }
    });
  }

  async markAsAccepted(id, userId) {
    return this.update(id, {
      is_accepted: true,
      accepted_at: new Date(),
      accepted_by_user_id: userId,
      used_count: this.model.sequelize.literal('used_count + 1')
    });
  }

  async revokeInvitation(id, revokedById) {
    return this.update(id, {
      is_revoked: true,
      revoked_at: new Date(),
      revoked_by: revokedById
    });
  }

  async findBySenderId(senderId) {
    return this.model.findAll({ where: { sender_id: senderId } });
  }
}

module.exports = ClientInvitationRepository; 