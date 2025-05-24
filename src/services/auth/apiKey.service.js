const ApiKeyRepository = require('../../data/repositories/auth/ApiKeyRepository');
const passwordUtil = require('../../utils/password.util');

class ApiKeyService {
  constructor() {
    this.apiKeyRepo = new ApiKeyRepository();
  }

  async createApiKey(userId, name) {
    const rawKey = passwordUtil.generateApiKey();
    const hashedKey = passwordUtil.hashApiKey(rawKey);
    
    const apiKey = await this.apiKeyRepo.create({
      user_id: userId,
      name,
      key: hashedKey,
      is_active: true
    });

    return { ...apiKey.get({ plain: true }), rawKey };
  }

  async validateApiKey(key) {
    const hashedKey = passwordUtil.hashApiKey(key);
    return this.apiKeyRepo.findActiveByKey(hashedKey);
  }

  async rotateApiKey(keyId) {
    const apiKey = await this.apiKeyRepo.findById(keyId);
    const newRawKey = passwordUtil.generateApiKey();
    const newHashedKey = passwordUtil.hashApiKey(newRawKey);

    await this.apiKeyRepo.rotateKey(keyId, newHashedKey);
    return { ...apiKey.get({ plain: true }), rawKey: newRawKey };
  }
}

module.exports = new ApiKeyService(); 