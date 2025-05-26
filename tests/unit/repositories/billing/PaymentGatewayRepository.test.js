const { PaymentGatewayRepository } = require('../../../../src/data/repositories/billing');
const { PaymentGateway } = require('../../../../src/data/models');

// Mock the model
jest.mock('../../../../src/data/models', () => ({
  PaymentGateway: {
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

describe('PaymentGatewayRepository', () => {
  let repository;
  
  beforeEach(() => {
    repository = new PaymentGatewayRepository();
    jest.clearAllMocks();
  });

  test('getActiveGateways should call findAll with correct parameters', async () => {
    const mockGateways = [
      { id: 1, provider: 'stripe', is_active: true },
      { id: 2, provider: 'paypal', is_active: true }
    ];
    PaymentGateway.findAll.mockResolvedValue(mockGateways);
    
    const result = await repository.getActiveGateways();
    
    expect(PaymentGateway.findAll).toHaveBeenCalledWith({ where: { is_active: true } });
    expect(result).toEqual(mockGateways);
  });

  test('findByProvider should call findOne with correct parameters', async () => {
    const provider = 'stripe';
    const mockGateway = { id: 1, provider, is_active: true };
    PaymentGateway.findOne.mockResolvedValue(mockGateway);
    
    const result = await repository.findByProvider(provider);
    
    expect(PaymentGateway.findOne).toHaveBeenCalledWith({ where: { provider } });
    expect(result).toEqual(mockGateway);
  });

  test('getActiveGatewayForProvider should call findOne with correct parameters', async () => {
    const provider = 'stripe';
    const mockGateway = { id: 1, provider, is_active: true };
    PaymentGateway.findOne.mockResolvedValue(mockGateway);
    
    const result = await repository.getActiveGatewayForProvider(provider);
    
    expect(PaymentGateway.findOne).toHaveBeenCalledWith({
      where: {
        provider,
        is_active: true
      }
    });
    expect(result).toEqual(mockGateway);
  });
}); 