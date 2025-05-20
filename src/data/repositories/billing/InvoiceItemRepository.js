const BaseRepository = require('../BaseRepository');
const { InvoiceItem } = require('../../models');

class InvoiceItemRepository extends BaseRepository {
  constructor() {
    super(InvoiceItem);
  }

  async bulkCreateForInvoice(invoiceId, items) {
    return this.model.bulkCreate(items.map(item => ({ ...item, invoice_id: invoiceId })));
  }

  async deleteForInvoice(invoiceId) {
    return this.model.destroy({ where: { invoice_id: invoiceId } });
  }
}

module.exports = InvoiceItemRepository; 