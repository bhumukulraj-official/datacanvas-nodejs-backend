const logger = require('../../utils/logger.util');
const { InvoiceRepository, InvoiceItemRepository, InvoiceStatusRepository } = require('../../data/repositories/billing');
const { CustomError, ResourceNotFoundError } = require('../../utils/error.util');

// Add initialization logging
logger.debug('Billing repositories loaded', {
  repositories: Object.keys(require('../../data/repositories/billing'))
});

class InvoiceService {
  constructor() {
    try {
      this.invoiceRepo = new InvoiceRepository();
      this.itemRepo = new InvoiceItemRepository();
      this.statusRepo = new InvoiceStatusRepository();
      logger.info('InvoiceService initialized with repositories');
    } catch (error) {
      logger.error('Error initializing InvoiceService repositories:', error);
      throw error;
    }
  }

  async createInvoice(invoiceData, items) {
    const status = await this.statusRepo.findByCode('draft');
    const invoice = await this.invoiceRepo.create({
      ...invoiceData,
      invoice_status_id: status.id
    });
    
    await this.itemRepo.bulkCreateForInvoice(invoice.id, items);
    return this.getInvoiceWithItems(invoice.id);
  }

  async getInvoiceWithItems(invoiceId) {
    const invoice = await this.invoiceRepo.getWithItems(invoiceId);
    if (!invoice) {
      throw new ResourceNotFoundError('Invoice', invoiceId);
    }
    return invoice;
  }

  async updateInvoiceStatus(invoiceId, statusCode) {
    const status = await this.statusRepo.findByCode(statusCode);
    if (!status) {
      throw new CustomError('Invalid invoice status', 400);
    }
    
    const [affectedCount] = await this.invoiceRepo.update(invoiceId, {
      invoice_status_id: status.id
    });
    
    if (affectedCount === 0) {
      throw new ResourceNotFoundError('Invoice', invoiceId);
    }
    
    return this.getInvoiceWithItems(invoiceId);
  }

  async getClientInvoices(clientId) {
    return this.invoiceRepo.getForClient(clientId, {
      include: ['InvoiceItem', 'InvoiceStatus']
    });
  }
}

module.exports = new InvoiceService(); 