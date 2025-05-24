const ClientInvitationRepository = require('../../data/repositories/auth/ClientInvitationRepository');
const { CustomError } = require('../../utils/error.util');
const passwordUtil = require('../../utils/password.util');

class ClientInvitationService {
  constructor() {
    this.invitationRepo = new ClientInvitationRepository();
  }

  async createInvitation(senderId, email) {
    const existing = await this.invitationRepo.findByEmail(email);
    if (existing.some(inv => !inv.is_accepted)) {
      throw new CustomError('Pending invitation already exists', 400);
    }

    const token = passwordUtil.generateRandomToken(32);
    return this.invitationRepo.create({
      sender_id: senderId,
      email,
      invitation_token: token,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
  }

  async acceptInvitation(token, userId) {
    const invitation = await this.invitationRepo.findValidInvitation(token);
    if (!invitation) {
      throw new CustomError('Invalid or expired invitation', 400);
    }

    await this.invitationRepo.markAsAccepted(invitation.id, userId);
    return { success: true };
  }
}

module.exports = new ClientInvitationService(); 