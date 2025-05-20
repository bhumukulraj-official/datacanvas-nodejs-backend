const BaseRepository = require('../BaseRepository');
const { PaymentStatus } = require('../../models');

class PaymentStatusRepository extends BaseRepository {
  constructor() {
    super(PaymentStatus);
  }

  async getActiveStatuses() {
    return this.model.findAll({ where: { is_active: true } });
  }
}

module.exports = PaymentStatusRepository; 