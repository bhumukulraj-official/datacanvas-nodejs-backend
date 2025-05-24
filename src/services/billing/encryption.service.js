const { EncryptionKeyRepository, EncryptionKeyAuditRepository } = require('../../data/repositories/billing');
const { CustomError } = require('../../utils/error.util');
const crypto = require('crypto');

class EncryptionService {
  constructor() {
    this.keyRepo = new EncryptionKeyRepository();
    this.auditRepo = new EncryptionKeyAuditRepository();
  }

  async rotateEncryptionKey(performedBy, ipAddress) {
    const currentKey = await this.keyRepo.getActiveKey();
    if (currentKey) {
      await this.keyRepo.update(currentKey.id, { is_active: false });
    }

    const newKey = crypto.generateKeySync('aes', { length: 256 });
    const keyRecord = await this.keyRepo.create({
      key_identifier: crypto.randomUUID(),
      key_data: newKey.export().toString('base64'),
      version: currentKey ? currentKey.version + 1 : 1,
      is_active: true
    });

    await this.auditRepo.logOperation(
      'rotate',
      keyRecord.version,
      performedBy,
      ipAddress
    );

    return keyRecord;
  }

  async getCurrentKey() {
    return this.keyRepo.getActiveKey();
  }

  async getKeyHistory(version) {
    return this.auditRepo.getByKeyVersion(version);
  }
}

module.exports = new EncryptionService(); 