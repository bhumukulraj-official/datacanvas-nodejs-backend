const BaseRepository = require('../BaseRepository');
const { InvoiceStatus } = require('../../models');

class InvoiceStatusRepository extends BaseRepository {
  constructor() {
    super(InvoiceStatus);
  }

  async getActiveStatuses() {
    return this.model.findAll({ where: { is_active: true } });
  }
}

module.exports = InvoiceStatusRepository; 