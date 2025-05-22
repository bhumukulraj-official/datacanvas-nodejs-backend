const BaseRepository = require('../BaseRepository');
const { ApiKey } = require('../../models');
const { Op } = require('sequelize');

class ApiKeyRepository extends BaseRepository {
  constructor() {
    super(ApiKey);
  }

  async findByKey(key) {
    return this.model.findOne({ where: { key } });
  }

  async findActiveByKey(key) {
    return this.model.findOne({ 
      where: { 
        key,
        is_active: true,
        expires_at: { [Op.gt]: new Date() }
      }
    });
  }

  async findByUserId(userId) {
    return this.model.findAll({ where: { user_id: userId } });
  }

  async deactivateKey(id) {
    return this.update(id, { is_active: false });
  }

  async rotateKey(id, newKey, newKeyHash) {
    const apiKey = await this.findById(id);
    
    return this.update(id, {
      key: newKey,
      key_hash: newKeyHash,
      previous_key: apiKey.key,
      last_rotated_at: new Date()
    });
  }
}

module.exports = ApiKeyRepository; 