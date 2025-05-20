const BaseRepository = require('../BaseRepository');
const { Invoice } = require('../../models');

class InvoiceRepository extends BaseRepository {
  constructor() {
    super(Invoice);
  }

  async findByInvoiceNumber(invoiceNumber) {
    return this.model.findOne({ where: { invoice_number: invoiceNumber } });
  }

  async getForClient(clientId, options = {}) {
    return this.model.findAll({
      where: { client_id: clientId },
      ...options
    });
  }

  async getWithItems(invoiceId) {
    return this.model.findByPk(invoiceId, {
      include: ['InvoiceItem']
    });
  }
}

module.exports = InvoiceRepository; 