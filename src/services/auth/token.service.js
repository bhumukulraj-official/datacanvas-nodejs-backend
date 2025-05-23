const { RefreshTokenRepository } = require('../../../data/repositories/auth');
const jwtUtil = require('../../utils/jwt.util');
const { redis } = require('../../config');

class TokenService {
  constructor() {
    this.refreshTokenRepo = new RefreshTokenRepository();
  }

  async revokeToken(token) {
    // Add to Redis blacklist with token expiration time
    const decoded = await jwtUtil.verifyAccessToken(token);
    const ttl = Math.floor((decoded.exp * 1000 - Date.now()) / 1000);
    
    await redis.set(`blacklist:${token}`, 'true', 'EX', ttl);
    return true;
  }

  async isTokenRevoked(token) {
    return redis.exists(`blacklist:${token}`);
  }

  async revokeAllTokensForUser(userId) {
    await this.refreshTokenRepo.revokeAllForUser(userId);
    return true;
  }
}

module.exports = new TokenService(); 