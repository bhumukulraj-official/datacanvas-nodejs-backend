const BaseRepository = require('../BaseRepository');
const { PaymentGateway } = require('../../models');

class PaymentGatewayRepository extends BaseRepository {
  constructor() {
    super(PaymentGateway);
  }

  async getActiveGateways() {
    return this.model.findAll({ where: { is_active: true } });
  }

  async findByProvider(provider) {
    return this.model.findOne({ where: { provider } });
  }

  async getActiveGatewayForProvider(provider) {
    return this.model.findOne({
      where: {
        provider,
        is_active: true
      }
    });
  }
}

module.exports = PaymentGatewayRepository; 