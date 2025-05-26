const { InvoiceStatusRepository } = require('../../../../src/data/repositories/billing');
const { InvoiceStatus } = require('../../../../src/data/models');

// Mock the model
jest.mock('../../../../src/data/models', () => ({
  InvoiceStatus: {
    findAll: jest.fn()
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

describe('InvoiceStatusRepository', () => {
  let invoiceStatusRepository;
  
  beforeEach(() => {
    invoiceStatusRepository = new InvoiceStatusRepository();
    jest.clearAllMocks();
  });

  test('getActiveStatuses should return active statuses', async () => {
    const mockStatuses = [
      { id: 1, name: 'Draft', is_active: true },
      { id: 2, name: 'Sent', is_active: true },
      { id: 3, name: 'Paid', is_active: true }
    ];
    
    InvoiceStatus.findAll.mockResolvedValue(mockStatuses);
    
    const result = await invoiceStatusRepository.getActiveStatuses();
    
    expect(InvoiceStatus.findAll).toHaveBeenCalledWith({ 
      where: { is_active: true } 
    });
    expect(result).toEqual(mockStatuses);
  });
}); 