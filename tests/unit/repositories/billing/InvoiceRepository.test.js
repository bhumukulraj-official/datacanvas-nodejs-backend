const InvoiceRepository = require('../../../../src/data/repositories/billing/InvoiceRepository');
const { Invoice } = require('../../../../src/data/models');

// Mock the logger
jest.mock('../../../../src/utils/logger.util', () => ({
  debug: jest.fn()
}));

// Mock the models
jest.mock('../../../../src/data/models', () => ({
  Invoice: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    name: 'Invoice'
  }
}));

describe('InvoiceRepository', () => {
  let repository;
  
  beforeEach(() => {
    repository = new InvoiceRepository();
    jest.clearAllMocks();
  });

  test('constructor should set the model correctly', () => {
    expect(repository.model).toBe(Invoice);
  });

  test('findByInvoiceNumber should call findOne with correct parameters', async () => {
    const mockInvoiceNumber = 'INV-2023-001';
    const mockResult = { id: 1, invoice_number: mockInvoiceNumber };
    Invoice.findOne.mockResolvedValue(mockResult);

    const result = await repository.findByInvoiceNumber(mockInvoiceNumber);
    
    expect(Invoice.findOne).toHaveBeenCalledWith({ 
      where: { invoice_number: mockInvoiceNumber } 
    });
    expect(result).toEqual(mockResult);
  });

  test('getForClient should call findAll with correct parameters', async () => {
    const mockClientId = 1;
    const mockResult = [
      { id: 1, client_id: mockClientId },
      { id: 2, client_id: mockClientId }
    ];
    Invoice.findAll.mockResolvedValue(mockResult);

    const result = await repository.getForClient(mockClientId);
    
    expect(Invoice.findAll).toHaveBeenCalledWith({ 
      where: { client_id: mockClientId } 
    });
    expect(result).toEqual(mockResult);
  });

  test('getForClient should include options when provided', async () => {
    const mockClientId = 1;
    const mockOptions = { limit: 10, order: [['created_at', 'DESC']] };
    const mockResult = [{ id: 1 }];
    Invoice.findAll.mockResolvedValue(mockResult);

    const result = await repository.getForClient(mockClientId, mockOptions);
    
    expect(Invoice.findAll).toHaveBeenCalledWith({ 
      where: { client_id: mockClientId },
      limit: 10,
      order: [['created_at', 'DESC']]
    });
    expect(result).toEqual(mockResult);
  });

  test('getWithItems should call findByPk with correct parameters', async () => {
    const mockInvoiceId = 1;
    const mockResult = { 
      id: mockInvoiceId, 
      InvoiceItem: [{ id: 1 }, { id: 2 }] 
    };
    Invoice.findByPk.mockResolvedValue(mockResult);

    const result = await repository.getWithItems(mockInvoiceId);
    
    expect(Invoice.findByPk).toHaveBeenCalledWith(mockInvoiceId, {
      include: ['InvoiceItem']
    });
    expect(result).toEqual(mockResult);
  });
}); 