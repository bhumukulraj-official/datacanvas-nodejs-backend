const BaseRepository = require('../BaseRepository');
const { PaymentProvider } = require('../../models');

class PaymentProviderRepository extends BaseRepository {
  constructor() {
    super(PaymentProvider);
  }

  async getActiveProviders() {
    return this.model.findAll({ where: { is_active: true } });
  }

  async findByCode(code) {
    return this.model.findOne({ where: { code } });
  }

  async getRefundCapableProviders() {
    return this.model.findAll({
      where: {
        is_active: true,
        supports_refunds: true
      }
    });
  }

  async getPartialPaymentProviders() {
    return this.model.findAll({
      where: {
        is_active: true,
        supports_partial_payments: true
      }
    });
  }
}

module.exports = PaymentProviderRepository; 