const UserRepository = require('../../data/repositories/auth/UserRepository');
const RefreshTokenRepository = require('../../data/repositories/auth/RefreshTokenRepository');
const EmailVerificationTokenRepository = require('../../data/repositories/auth/EmailVerificationTokenRepository');
const passwordUtil = require('../../utils/password.util');
const jwtUtil = require('../../utils/jwt.util');
const { CustomError, InvalidCredentialsError, TokenExpiredError } = require('../../utils/error.util');
const { transporter, templatePaths } = require('../../config/email');
const logger = require('../../utils/logger.util');
const crypto = require('crypto');

class AuthService {
  constructor() {
    this.userRepository = new UserRepository();
    this.refreshTokenRepository = new RefreshTokenRepository();
    this.emailVerificationTokenRepository = new EmailVerificationTokenRepository();
  }

  async login(email, password) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new InvalidCredentialsError('Invalid email or password');
    }

    const isValid = await passwordUtil.verifyPassword(password, user.password_hash);
    if (!isValid) {
      throw new InvalidCredentialsError('Invalid email or password');
    }

    const accessToken = await jwtUtil.generateAccessToken({
      id: user.id,
      email: user.email,
      roles: user.UserRoles.map(ur => ur.role)
    });

    const refreshToken = await jwtUtil.generateRefreshToken({ id: user.id });
    
    await this.refreshTokenRepository.create({
      token: refreshToken,
      user_id: user.id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    return {
      user: this._sanitizeUser(user),
      tokens: { accessToken, refreshToken }
    };
  }

  async logout(refreshToken) {
    await this.refreshTokenRepository.revokeToken(refreshToken);
    return { success: true };
  }

  async refreshToken(refreshToken) {
    const tokenDoc = await this.refreshTokenRepository.findByToken(refreshToken);
    
    if (!tokenDoc || tokenDoc.is_revoked || new Date() > tokenDoc.expires_at) {
      throw new TokenExpiredError();
    }

    const user = await this.userRepository.findById(tokenDoc.user_id);
    if (!user) {
      throw new CustomError('User not found', 404);
    }

    const newAccessToken = await jwtUtil.generateAccessToken({
      id: user.id,
      email: user.email,
      roles: user.UserRoles.map(ur => ur.role)
    });

    const newRefreshToken = await jwtUtil.generateRefreshToken({ id: user.id });

    await this.refreshTokenRepository.revokeToken(refreshToken);
    await this.refreshTokenRepository.create({
      token: newRefreshToken,
      user_id: user.id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  }

  async verifyEmail(token) {
    const verificationToken = await this.emailVerificationTokenRepository.findByToken(token);
    
    if (!verificationToken) {
      throw new CustomError('Invalid verification token', 400, 'AUTH_007');
    }
    
    if (new Date() > verificationToken.expires_at) {
      throw new CustomError('Token expired', 400, 'AUTH_008');
    }
    
    await this.userRepository.verifyEmail(verificationToken.user_id);
    await this.emailVerificationTokenRepository.deleteForUser(verificationToken.user_id);
    
    return { success: true };
  }
  
  async resendVerificationEmail(email) {
    const user = await this.userRepository.findByEmail(email);
    
    if (!user) {
      throw new CustomError('Email not found', 404, 'AUTH_009');
    }
    
    if (user.email_verified) {
      throw new CustomError('Email already verified', 400, 'AUTH_010');
    }
    
    await this.emailVerificationTokenRepository.deleteForUser(user.id);
    await this._sendVerificationEmail(user);
    
    return { success: true };
  }
  
  async changePassword(userId, currentPassword, newPassword) {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new CustomError('User not found', 404);
    }
    
    const isValid = await passwordUtil.verifyPassword(currentPassword, user.password_hash);
    if (!isValid) {
      throw new InvalidCredentialsError('Current password is incorrect');
    }
    
    // Check if new password meets requirements (should be done by validation middleware too)
    if (newPassword.length < 8) {
      throw new CustomError('Password must be at least 8 characters long', 400, 'VAL_001');
    }
    
    const passwordHash = await passwordUtil.hashPassword(newPassword);
    await this.userRepository.updatePassword(userId, passwordHash);
    
    // Invalidate all refresh tokens for security
    await this.refreshTokenRepository.revokeAllForUser(userId);
    
    return { success: true };
  }
  
  async _sendVerificationEmail(user) {
    try {
      // Generate verification token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      await this.emailVerificationTokenRepository.create({
        token,
        user_id: user.id,
        expires_at: expiresAt
      });
      
      // Send email
      const verificationUrl = `${process.env.FRONTEND_URL}/auth/verify-email?token=${token}`;
      
      await transporter.sendMail({
        to: user.email,
        subject: 'Verify your email address',
        html: `<p>Please verify your email address by clicking the link below:</p>
               <p><a href="${verificationUrl}">${verificationUrl}</a></p>
               <p>This link will expire in 24 hours.</p>`
      });
      
      logger.info('Verification email sent', { email: user.email });
    } catch (error) {
      logger.error('Failed to send verification email', { error: error.message, userId: user.id });
      throw new CustomError('Failed to send verification email', 500);
    }
  }

  _sanitizeUser(user) {
    const { password_hash, ...userData } = user.get({ plain: true });
    return userData;
  }
}

module.exports = new AuthService(); 