const RateLimitConfigRepository = require('../../../../src/data/repositories/public_api/RateLimitConfigRepository');
const RateLimitConfig = require('../../../../src/data/models/public_api/RateLimitConfig');

// Mock the model
jest.mock('../../../../src/data/models/public_api/RateLimitConfig', () => ({
  findAll: jest.fn(),
  update: jest.fn()
}));

describe('RateLimitConfigRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('findActiveConfigs should call findAll with correct parameters', async () => {
    const mockConfigs = [
      { id: 1, endpoint_pattern: '/api/users', entity_type: 'ip', is_active: true },
      { id: 2, endpoint_pattern: '/api/projects', entity_type: 'user', is_active: true }
    ];
    
    RateLimitConfig.findAll.mockResolvedValue(mockConfigs);
    
    const result = await RateLimitConfigRepository.findActiveConfigs();
    
    expect(RateLimitConfig.findAll).toHaveBeenCalledWith({
      where: { is_active: true },
      order: [['endpoint_pattern', 'ASC']]
    });
    expect(result).toEqual(mockConfigs);
  });

  test('findByEndpointPattern should call findAll with correct parameters', async () => {
    const pattern = '/api/users';
    const mockConfigs = [
      { id: 1, endpoint_pattern: pattern, entity_type: 'ip' },
      { id: 2, endpoint_pattern: pattern, entity_type: 'user' }
    ];
    
    RateLimitConfig.findAll.mockResolvedValue(mockConfigs);
    
    const result = await RateLimitConfigRepository.findByEndpointPattern(pattern);
    
    expect(RateLimitConfig.findAll).toHaveBeenCalledWith({
      where: { endpoint_pattern: pattern },
      order: [['entity_type', 'ASC']]
    });
    expect(result).toEqual(mockConfigs);
  });

  test('findByEntityType should call findAll with correct parameters', async () => {
    const entityType = 'ip';
    const mockConfigs = [
      { id: 1, endpoint_pattern: '/api/users', entity_type: entityType },
      { id: 2, endpoint_pattern: '/api/projects', entity_type: entityType }
    ];
    
    RateLimitConfig.findAll.mockResolvedValue(mockConfigs);
    
    const result = await RateLimitConfigRepository.findByEntityType(entityType);
    
    expect(RateLimitConfig.findAll).toHaveBeenCalledWith({
      where: { entity_type: entityType },
      order: [['endpoint_pattern', 'ASC']]
    });
    expect(result).toEqual(mockConfigs);
  });

  test('toggleActive should call update with correct parameters', async () => {
    const id = 1;
    const isActive = false;
    const updateResult = [1]; // Number of affected rows
    
    RateLimitConfig.update.mockResolvedValue(updateResult);
    
    const result = await RateLimitConfigRepository.toggleActive(id, isActive);
    
    expect(RateLimitConfig.update).toHaveBeenCalledWith(
      { is_active: isActive },
      { where: { id } }
    );
    expect(result).toEqual(updateResult);
  });
}); 