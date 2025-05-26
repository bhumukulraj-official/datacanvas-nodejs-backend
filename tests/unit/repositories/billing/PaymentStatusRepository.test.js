const { PaymentStatusRepository } = require('../../../../src/data/repositories/billing');
const { PaymentStatus } = require('../../../../src/data/models');

// Mock the model
jest.mock('../../../../src/data/models', () => ({
  PaymentStatus: {
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

describe('PaymentStatusRepository', () => {
  let repository;
  
  beforeEach(() => {
    repository = new PaymentStatusRepository();
    jest.clearAllMocks();
  });

  test('getActiveStatuses should call findAll with correct parameters', async () => {
    const mockStatuses = [
      { id: 1, name: 'Pending', is_active: true },
      { id: 2, name: 'Completed', is_active: true },
      { id: 3, name: 'Failed', is_active: true }
    ];
    
    PaymentStatus.findAll.mockResolvedValue(mockStatuses);
    
    const result = await repository.getActiveStatuses();
    
    expect(PaymentStatus.findAll).toHaveBeenCalledWith({ 
      where: { is_active: true } 
    });
    expect(result).toEqual(mockStatuses);
  });
}); 