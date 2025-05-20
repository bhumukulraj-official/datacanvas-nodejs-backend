const BaseRepository = require('../BaseRepository');
const { UserRole } = require('../../models');

class UserRoleRepository extends BaseRepository {
  constructor() {
    super(UserRole);
  }

  async getActiveRoles() {
    return this.model.findAll({ where: { is_active: true } });
  }
}

module.exports = UserRoleRepository; 