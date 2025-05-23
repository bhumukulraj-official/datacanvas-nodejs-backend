const { UserRepository } = require('../../../data/repositories/auth');
const { EmailVerificationTokenRepository } = require('../../../data/repositories/auth');
const passwordUtil = require('../../utils/password.util');
const { CustomError } = require('../../utils/error.util');

class PasswordService {
  constructor() {
    this.userRepo = new UserRepository();
    this.tokenRepo = new EmailVerificationTokenRepository();
  }

  async requestPasswordReset(email) {
    const user = await this.userRepo.findByEmail(email);
    if (!user) return { success: true }; // Prevent email enumeration

    const token = passwordUtil.generateRandomToken(32);
    await this.tokenRepo.create({
      token,
      user_id: user.id,
      expires_at: new Date(Date.now() + 3600000) // 1 hour
    });

    // TODO: Send email with reset token
    return { success: true };
  }

  async resetPassword(token, newPassword) {
    const tokenRecord = await this.tokenRepo.findByToken(token);
    if (!tokenRecord || new Date() > tokenRecord.expires_at) {
      throw new CustomError('Invalid or expired token', 400);
    }

    const hashedPassword = await passwordUtil.hashPassword(newPassword);
    await this.userRepo.updatePassword(tokenRecord.user_id, hashedPassword);
    await this.tokenRepo.deleteForUser(tokenRecord.user_id);
    
    return { success: true };
  }
}

module.exports = new PasswordService(); 