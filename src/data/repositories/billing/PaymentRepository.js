const BaseRepository = require('../BaseRepository');
const { Payment } = require('../../models');

class PaymentRepository extends BaseRepository {
  constructor() {
    super(Payment);
  }

  async getByTransactionId(transactionId) {
    return this.model.findOne({ where: { transaction_id: transactionId } });
  }

  async getPaymentsForClient(clientId) {
    return this.model.findAll({
      where: { client_id: clientId },
      order: [['payment_date', 'DESC']]
    });
  }

  async updateProviderResponse(paymentId, response) {
    return this.update(paymentId, {
      provider_response: response,
      status_code: response.success ? 'completed' : 'failed'
    });
  }
}

module.exports = PaymentRepository; 