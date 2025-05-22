const BaseRepository = require('../BaseRepository');
const Version = require('../../models/public_api/Version');
const { Op } = require('sequelize');

class VersionRepository extends BaseRepository {
  constructor() {
    super(Version);
  }

  async findByVersion(version) {
    return this.model.findOne({
      where: { version }
    });
  }

  async findActiveVersions() {
    return this.model.findAll({
      where: { is_active: true },
      order: [['version', 'DESC']]
    });
  }

  async findDeprecatedVersions() {
    const now = new Date();
    return this.model.findAll({
      where: { 
        deprecated_at: {
          [Op.not]: null
        },
        sunset_date: {
          [Op.gt]: now
        }
      },
      order: [['sunset_date', 'ASC']]
    });
  }

  async findSunsetVersions() {
    const now = new Date();
    return this.model.findAll({
      where: { 
        sunset_date: {
          [Op.lte]: now
        }
      },
      order: [['sunset_date', 'DESC']]
    });
  }

  async deprecateVersion(version, sunsetDate) {
    const now = new Date();
    return this.model.update(
      { 
        deprecated_at: now,
        sunset_date: sunsetDate
      },
      { where: { version } }
    );
  }

  async toggleActive(version, isActive) {
    return this.model.update(
      { is_active: isActive },
      { where: { version } }
    );
  }
}

module.exports = new VersionRepository(); 