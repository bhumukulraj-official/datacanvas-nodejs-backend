const BaseRepository = require('../BaseRepository');
const { EncryptionKey } = require('../../models');

class EncryptionKeyRepository extends BaseRepository {
  constructor() {
    super(EncryptionKey);
  }

  async getActiveKey() {
    return this.model.findOne({ where: { is_active: true } });
  }

  async getByVersion(version) {
    return this.model.findOne({ where: { version } });
  }

  async getByKeyIdentifier(keyIdentifier) {
    return this.model.findOne({ where: { key_identifier: keyIdentifier } });
  }
}

module.exports = EncryptionKeyRepository; 