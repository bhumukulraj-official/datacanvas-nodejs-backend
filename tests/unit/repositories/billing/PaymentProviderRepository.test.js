const { PaymentProviderRepository } = require('../../../../src/data/repositories/billing');
const { PaymentProvider } = require('../../../../src/data/models');

// Mock the model
jest.mock('../../../../src/data/models', () => ({
  PaymentProvider: {
    findAll: jest.fn(),
    findOne: jest.fn()
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

describe('PaymentProviderRepository', () => {
  let paymentProviderRepository;
  
  beforeEach(() => {
    paymentProviderRepository = new PaymentProviderRepository();
    jest.clearAllMocks();
  });

  test('getActiveProviders should return active providers', async () => {
    const mockProviders = [
      { id: 1, name: 'Stripe', code: 'stripe', is_active: true },
      { id: 2, name: 'PayPal', code: 'paypal', is_active: true }
    ];
    
    PaymentProvider.findAll.mockResolvedValue(mockProviders);
    
    const result = await paymentProviderRepository.getActiveProviders();
    
    expect(PaymentProvider.findAll).toHaveBeenCalledWith({ 
      where: { is_active: true } 
    });
    expect(result).toEqual(mockProviders);
  });

  test('findByCode should find provider by code', async () => {
    const providerCode = 'stripe';
    const mockProvider = { id: 1, name: 'Stripe', code: providerCode, is_active: true };
    
    PaymentProvider.findOne.mockResolvedValue(mockProvider);
    
    const result = await paymentProviderRepository.findByCode(providerCode);
    
    expect(PaymentProvider.findOne).toHaveBeenCalledWith({ 
      where: { code: providerCode } 
    });
    expect(result).toEqual(mockProvider);
  });

  test('getRefundCapableProviders should return providers that support refunds', async () => {
    const mockProviders = [
      { id: 1, name: 'Stripe', supports_refunds: true, is_active: true }
    ];
    
    PaymentProvider.findAll.mockResolvedValue(mockProviders);
    
    const result = await paymentProviderRepository.getRefundCapableProviders();
    
    expect(PaymentProvider.findAll).toHaveBeenCalledWith({ 
      where: { 
        is_active: true,
        supports_refunds: true
      } 
    });
    expect(result).toEqual(mockProviders);
  });

  test('getPartialPaymentProviders should return providers that support partial payments', async () => {
    const mockProviders = [
      { id: 1, name: 'Stripe', supports_partial_payments: true, is_active: true }
    ];
    
    PaymentProvider.findAll.mockResolvedValue(mockProviders);
    
    const result = await paymentProviderRepository.getPartialPaymentProviders();
    
    expect(PaymentProvider.findAll).toHaveBeenCalledWith({ 
      where: { 
        is_active: true,
        supports_partial_payments: true
      } 
    });
    expect(result).toEqual(mockProviders);
  });
});