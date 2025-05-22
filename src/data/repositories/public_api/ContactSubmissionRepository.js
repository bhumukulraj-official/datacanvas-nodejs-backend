const BaseRepository = require('../BaseRepository');
const ContactSubmission = require('../../models/public_api/ContactSubmission');

class ContactSubmissionRepository extends BaseRepository {
  constructor() {
    super(ContactSubmission);
  }

  async findByUuid(uuid) {
    return this.model.findOne({
      where: { uuid }
    });
  }

  async findByEmail(email) {
    return this.model.findAll({
      where: { email },
      order: [['created_at', 'DESC']]
    });
  }

  async findByStatus(status) {
    return this.model.findAll({
      where: { status },
      order: [['created_at', 'DESC']]
    });
  }

  async markAsReviewed(uuid) {
    return this.model.update(
      { status: 'reviewed' },
      { where: { uuid } }
    );
  }

  async markAsReplied(uuid) {
    return this.model.update(
      { status: 'replied' },
      { where: { uuid } }
    );
  }

  async markAsSpam(uuid) {
    return this.model.update(
      { status: 'spam' },
      { where: { uuid } }
    );
  }

  async softDelete(uuid) {
    return this.model.update(
      { is_deleted: true },
      { where: { uuid } }
    );
  }
}

module.exports = new ContactSubmissionRepository(); 