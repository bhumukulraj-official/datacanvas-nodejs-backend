const BaseRepository = require('../BaseRepository');
const { Invoice } = require('../../models');
const logger = require('../../../utils/logger.util');

class InvoiceRepository extends BaseRepository {
  constructor() {
    super(Invoice);
    logger.debug('InvoiceRepository initialized with model:', this.model.name);
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