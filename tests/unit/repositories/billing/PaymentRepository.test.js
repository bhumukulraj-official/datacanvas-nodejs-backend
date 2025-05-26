const { PaymentRepository } = require('../../../../src/data/repositories/billing');
const { Payment } = require('../../../../src/data/models');

// Mock the model
jest.mock('../../../../src/data/models', () => ({
  Payment: {
    findOne: jest.fn(),
    findAll: jest.fn()
  }
}));

// Mock the BaseRepository
jest.mock('../../../../src/data/repositories/BaseRepository', () => {
  return class MockBaseRepository {
    constructor(model) {
      this.model = model;
    }
    
    async update(id, data) {
      // Mock implementation
      return { id, ...data };
    }
  };
});

describe('PaymentRepository', () => {
  let repository;
  
  beforeEach(() => {
    repository = new PaymentRepository();
    jest.clearAllMocks();
  });

  test('getByTransactionId should call findOne with correct parameters', async () => {
    const transactionId = 'txn-123';
    const mockPayment = { id: 1, transaction_id: transactionId };
    Payment.findOne.mockResolvedValue(mockPayment);
    
    const result = await repository.getByTransactionId(transactionId);
    
    expect(Payment.findOne).toHaveBeenCalledWith({ where: { transaction_id: transactionId } });
    expect(result).toEqual(mockPayment);
  });

  test('getPaymentsForClient should call findAll with correct parameters', async () => {
    const clientId = 5;
    const mockPayments = [
      { id: 1, client_id: clientId },
      { id: 2, client_id: clientId }
    ];
    Payment.findAll.mockResolvedValue(mockPayments);
    
    const result = await repository.getPaymentsForClient(clientId);
    
    expect(Payment.findAll).toHaveBeenCalledWith({
      where: { client_id: clientId },
      order: [['payment_date', 'DESC']]
    });
    expect(result).toEqual(mockPayments);
  });

  test('updateProviderResponse should call update with correct parameters', async () => {
    const paymentId = 1;
    const response = { success: true, message: 'Payment processed' };
    
    // Mock the update method
    repository.update = jest.fn().mockResolvedValue({ 
      id: paymentId, 
      provider_response: response,
      status_code: 'completed'
    });
    
    const result = await repository.updateProviderResponse(paymentId, response);
    
    expect(repository.update).toHaveBeenCalledWith(paymentId, {
      provider_response: response,
      status_code: 'completed'
    });
    expect(result).toEqual({ 
      id: paymentId, 
      provider_response: response,
      status_code: 'completed'
    });
  });

  test('updateProviderResponse should set status to failed when success is false', async () => {
    const paymentId = 1;
    const response = { success: false, message: 'Payment failed' };
    
    // Mock the update method
    repository.update = jest.fn().mockResolvedValue({ 
      id: paymentId, 
      provider_response: response,
      status_code: 'failed'
    });
    
    const result = await repository.updateProviderResponse(paymentId, response);
    
    expect(repository.update).toHaveBeenCalledWith(paymentId, {
      provider_response: response,
      status_code: 'failed'
    });
    expect(result).toEqual({ 
      id: paymentId, 
      provider_response: response,
      status_code: 'failed'
    });
  });
}); 