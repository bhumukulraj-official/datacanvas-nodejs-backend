const RateLimitRepository = require('../../../../src/data/repositories/public_api/RateLimitRepository');
const RateLimit = require('../../../../src/data/models/public_api/RateLimit');
const { Op } = require('sequelize');

// Mock the model
jest.mock('../../../../src/data/models/public_api/RateLimit', () => ({
  findAll: jest.fn(),
  increment: jest.fn(),
  destroy: jest.fn()
}));

// Mock sequelize Op
jest.mock('sequelize', () => ({
  Op: {
    lte: Symbol('lte'),
    lt: Symbol('lt')
  }
}));

describe('RateLimitRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('findActiveByEntityAndEndpoint should call findAll with correct parameters', async () => {
    const entityType = 'ip';
    const entityIdentifier = '127.0.0.1';
    const endpoint = '/api/users';
    
    const mockLimits = [
      { id: 1, entity_type: entityType, entity_identifier: entityIdentifier, endpoint }
    ];
    
    RateLimit.findAll.mockResolvedValue(mockLimits);
    
    // Mock Date for consistent testing
    const now = new Date();
    jest.spyOn(global, 'Date').mockImplementation(() => now);
    
    const result = await RateLimitRepository.findActiveByEntityAndEndpoint(entityType, entityIdentifier, endpoint);
    
    expect(RateLimit.findAll).toHaveBeenCalledWith({
      where: {
        entity_type: entityType,
        entity_identifier: entityIdentifier,
        endpoint,
        window_start: {
          [Op.lte]: now
        }
      },
      order: [['window_start', 'DESC']]
    });
    expect(result).toEqual(mockLimits);
    
    // Restore Date mock
    global.Date.mockRestore();
  });

  test('incrementRequestCount should call increment with correct parameters', async () => {
    const id = 1;
    const incrementResult = { id, requests_count: 10 };
    
    RateLimit.increment.mockResolvedValue([incrementResult]);
    
    const result = await RateLimitRepository.incrementRequestCount(id);
    
    expect(RateLimit.increment).toHaveBeenCalledWith('requests_count', {
      where: { id }
    });
    expect(result).toEqual([incrementResult]);
  });

  test('cleanupExpiredLimits should call destroy with correct parameters', async () => {
    const deleteCount = 5;
    
    RateLimit.destroy.mockResolvedValue(deleteCount);
    
    // Mock Date for consistent testing
    const now = new Date();
    jest.spyOn(global, 'Date').mockImplementation(() => now);
    
    const result = await RateLimitRepository.cleanupExpiredLimits();
    
    expect(RateLimit.destroy).toHaveBeenCalledWith({
      where: {
        window_start: {
          [Op.lt]: now
        }
      }
    });
    expect(result).toEqual(deleteCount);
    
    // Restore Date mock
    global.Date.mockRestore();
  });
}); 