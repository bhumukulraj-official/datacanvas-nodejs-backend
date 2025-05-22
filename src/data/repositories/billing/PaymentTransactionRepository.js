const BaseRepository = require('../BaseRepository');
const { PaymentTransaction } = require('../../models');

class PaymentTransactionRepository extends BaseRepository {
  constructor() {
    super(PaymentTransaction);
  }

  async getByTransactionId(transactionId) {
    return this.model.findOne({ where: { transaction_id: transactionId } });
  }

  async getForInvoice(invoiceId) {
    return this.model.findAll({
      where: { invoice_id: invoiceId },
      order: [['created_at', 'DESC']]
    });
  }

  async getByStatus(status) {
    return this.model.findAll({
      where: { status },
      order: [['created_at', 'DESC']]
    });
  }

  async getByDistributedXid(distributedXid) {
    return this.model.findAll({
      where: { distributed_xid: distributedXid }
    });
  }

  async updateStatus(transactionId, status, responseData = null) {
    const updateData = { status };
    if (responseData) {
      updateData.response_data = responseData;
      updateData.updated_at = new Date();
    }
    
    return this.model.update(updateData, {
      where: { transaction_id: transactionId }
    });
  }
}

module.exports = PaymentTransactionRepository; 