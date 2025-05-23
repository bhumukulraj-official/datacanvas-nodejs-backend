const { UserRepository } = require('../../../data/repositories/auth');
const { RefreshTokenRepository } = require('../../../data/repositories/auth');
const passwordUtil = require('../../utils/password.util');
const jwtUtil = require('../../utils/jwt.util');
const { CustomError, InvalidCredentialsError, TokenExpiredError } = require('../../utils/error.util');

class AuthService {
  constructor() {
    this.userRepository = new UserRepository();
    this.refreshTokenRepository = new RefreshTokenRepository();
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

  _sanitizeUser(user) {
    const { password_hash, ...userData } = user.get({ plain: true });
    return userData;
  }
}

module.exports = new AuthService(); 