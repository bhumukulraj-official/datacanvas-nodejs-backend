const BaseRepository = require('../BaseRepository');
const VersionLifecycleLog = require('../../models/public_api/VersionLifecycleLog');

class VersionLifecycleLogRepository extends BaseRepository {
  constructor() {
    super(VersionLifecycleLog);
  }

  async findByVersion(version) {
    return this.model.findAll({
      where: { version },
      order: [['performed_at', 'DESC']]
    });
  }

  async findByAction(action) {
    return this.model.findAll({
      where: { action },
      order: [['performed_at', 'DESC']]
    });
  }

  async logAction(version, action, details, performedBy) {
    return this.model.create({
      version,
      action,
      details,
      performed_by: performedBy,
      performed_at: new Date()
    });
  }

  async getVersionHistory(version) {
    return this.model.findAll({
      where: { version },
      order: [['performed_at', 'ASC']],
      include: [{ association: 'Version' }]
    });
  }
}

module.exports = new VersionLifecycleLogRepository(); 