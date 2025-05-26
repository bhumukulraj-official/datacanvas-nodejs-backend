const { PaymentTransactionRepository } = require('../../../../src/data/repositories/billing');
const { PaymentTransaction } = require('../../../../src/data/models');

// Mock the model
jest.mock('../../../../src/data/models', () => ({
  PaymentTransaction: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn()
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

describe('PaymentTransactionRepository', () => {
  let repository;
  
  beforeEach(() => {
    repository = new PaymentTransactionRepository();
    jest.clearAllMocks();
  });

  test('getByTransactionId should call findOne with correct parameters', async () => {
    const transactionId = 'txn-123';
    const mockTransaction = { id: 1, transaction_id: transactionId };
    PaymentTransaction.findOne.mockResolvedValue(mockTransaction);
    
    const result = await repository.getByTransactionId(transactionId);
    
    expect(PaymentTransaction.findOne).toHaveBeenCalledWith({ where: { transaction_id: transactionId } });
    expect(result).toEqual(mockTransaction);
  });

  test('getForInvoice should call findAll with correct parameters', async () => {
    const invoiceId = 5;
    const mockTransactions = [
      { id: 1, invoice_id: invoiceId },
      { id: 2, invoice_id: invoiceId }
    ];
    PaymentTransaction.findAll.mockResolvedValue(mockTransactions);
    
    const result = await repository.getForInvoice(invoiceId);
    
    expect(PaymentTransaction.findAll).toHaveBeenCalledWith({
      where: { invoice_id: invoiceId },
      order: [['created_at', 'DESC']]
    });
    expect(result).toEqual(mockTransactions);
  });

  test('getByStatus should call findAll with correct parameters', async () => {
    const status = 'pending';
    const mockTransactions = [
      { id: 1, status },
      { id: 2, status }
    ];
    PaymentTransaction.findAll.mockResolvedValue(mockTransactions);
    
    const result = await repository.getByStatus(status);
    
    expect(PaymentTransaction.findAll).toHaveBeenCalledWith({
      where: { status },
      order: [['created_at', 'DESC']]
    });
    expect(result).toEqual(mockTransactions);
  });

  test('getByDistributedXid should call findAll with correct parameters', async () => {
    const distributedXid = 'dist-xid-123';
    const mockTransactions = [
      { id: 1, distributed_xid: distributedXid },
      { id: 2, distributed_xid: distributedXid }
    ];
    PaymentTransaction.findAll.mockResolvedValue(mockTransactions);
    
    const result = await repository.getByDistributedXid(distributedXid);
    
    expect(PaymentTransaction.findAll).toHaveBeenCalledWith({
      where: { distributed_xid: distributedXid }
    });
    expect(result).toEqual(mockTransactions);
  });

  test('updateStatus should call update with correct parameters', async () => {
    const transactionId = 'txn-123';
    const status = 'completed';
    const updateResult = [1]; // Number of affected rows
    PaymentTransaction.update.mockResolvedValue(updateResult);
    
    const result = await repository.updateStatus(transactionId, status);
    
    expect(PaymentTransaction.update).toHaveBeenCalledWith(
      { status },
      { where: { transaction_id: transactionId } }
    );
    expect(result).toEqual(updateResult);
  });

  test('updateStatus should include response data when provided', async () => {
    const transactionId = 'txn-123';
    const status = 'completed';
    const responseData = { payment_id: 'pay-123', amount: 100 };
    const updateResult = [1]; // Number of affected rows
    
    // Mock Date for consistent testing
    const now = new Date();
    jest.spyOn(global, 'Date').mockImplementation(() => now);
    
    PaymentTransaction.update.mockResolvedValue(updateResult);
    
    const result = await repository.updateStatus(transactionId, status, responseData);
    
    expect(PaymentTransaction.update).toHaveBeenCalledWith(
      { 
        status,
        response_data: responseData,
        updated_at: now
      },
      { where: { transaction_id: transactionId } }
    );
    expect(result).toEqual(updateResult);
    
    // Restore Date mock
    global.Date.mockRestore();
  });
}); 