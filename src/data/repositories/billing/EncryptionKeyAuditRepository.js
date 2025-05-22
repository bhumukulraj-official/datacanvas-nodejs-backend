const BaseRepository = require('../BaseRepository');
const { EncryptionKeyAudit } = require('../../models');

class EncryptionKeyAuditRepository extends BaseRepository {
  constructor() {
    super(EncryptionKeyAudit);
  }

  async getByKeyVersion(keyVersion) {
    return this.model.findAll({
      where: { key_version: keyVersion },
      order: [['operation_timestamp', 'DESC']]
    });
  }

  async logOperation(operation, keyVersion, performedBy, ipAddress) {
    return this.create({
      operation,
      key_version: keyVersion,
      performed_by: performedBy,
      ip_address: ipAddress,
      operation_timestamp: new Date()
    });
  }
}

module.exports = EncryptionKeyAuditRepository; 