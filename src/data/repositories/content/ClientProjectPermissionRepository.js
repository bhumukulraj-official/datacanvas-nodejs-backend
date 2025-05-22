const BaseRepository = require('../BaseRepository');
const { ClientProjectPermission } = require('../../models');

class ClientProjectPermissionRepository extends BaseRepository {
  constructor() {
    super(ClientProjectPermission);
  }

  async getByAssignmentId(assignmentId) {
    return this.model.findOne({
      where: { assignment_id: assignmentId }
    });
  }

  async updatePermissions(assignmentId, permissions) {
    return this.model.update(
      permissions,
      { where: { assignment_id: assignmentId } }
    );
  }

  async createDefaultPermissions(assignmentId) {
    return this.create({
      assignment_id: assignmentId,
      can_view_files: true,
      can_view_updates: true,
      can_download: true,
      can_message: true,
      can_view_invoices: false,
      can_make_payments: false,
      can_invite_collaborators: false
    });
  }
}

module.exports = ClientProjectPermissionRepository; 