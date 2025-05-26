const { InvoiceItemRepository } = require('../../../../src/data/repositories/billing');
const { InvoiceItem } = require('../../../../src/data/models');

// Mock the model
jest.mock('../../../../src/data/models', () => ({
  InvoiceItem: {
    bulkCreate: jest.fn(),
    destroy: jest.fn()
  }
}));

// Mock the BaseRepository
jest.mock('../../../../src/data/repositories/BaseRepository', () => {
  return class MockBaseRepository {
    constructor(model) {
      this.model = model;
    }
  };
});

describe('InvoiceItemRepository', () => {
  let invoiceItemRepository;
  
  beforeEach(() => {
    invoiceItemRepository = new InvoiceItemRepository();
    jest.clearAllMocks();
  });

  test('bulkCreateForInvoice should create multiple items with invoice ID', async () => {
    const invoiceId = 123;
    const items = [
      { description: 'Item 1', amount: 100 },
      { description: 'Item 2', amount: 200 }
    ];
    
    const expectedItemsWithInvoiceId = [
      { description: 'Item 1', amount: 100, invoice_id: invoiceId },
      { description: 'Item 2', amount: 200, invoice_id: invoiceId }
    ];
    
    const mockCreatedItems = [
      { id: 1, ...expectedItemsWithInvoiceId[0] },
      { id: 2, ...expectedItemsWithInvoiceId[1] }
    ];
    
    InvoiceItem.bulkCreate.mockResolvedValue(mockCreatedItems);
    
    const result = await invoiceItemRepository.bulkCreateForInvoice(invoiceId, items);
    
    expect(InvoiceItem.bulkCreate).toHaveBeenCalledWith(expectedItemsWithInvoiceId);
    expect(result).toEqual(mockCreatedItems);
  });

  test('deleteForInvoice should delete all items for an invoice', async () => {
    const invoiceId = 123;
    const deletedCount = 5;
    
    InvoiceItem.destroy.mockResolvedValue(deletedCount);
    
    const result = await invoiceItemRepository.deleteForInvoice(invoiceId);
    
    expect(InvoiceItem.destroy).toHaveBeenCalledWith({ 
      where: { invoice_id: invoiceId } 
    });
    expect(result).toBe(deletedCount);
  });
}); 