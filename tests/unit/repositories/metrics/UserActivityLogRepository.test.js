const { UserActivityLogRepository } = require('../../../../src/data/repositories/metrics');
const { UserActivityLog } = require('../../../../src/data/models');

// Mock the models
jest.mock('../../../../src/data/models', () => ({
  UserActivityLog: {
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

describe('UserActivityLogRepository', () => {
  let repository;
  
  beforeEach(() => {
    repository = new UserActivityLogRepository();
    jest.clearAllMocks();
  });

  test('getRecentActivities should call findAll with correct parameters', async () => {
    const userId = 5;
    const limit = 10;
    const mockActivities = [
      { id: 1, user_id: userId, activity_type: 'login' },
      { id: 2, user_id: userId, activity_type: 'file_upload' }
    ];
    
    UserActivityLog.findAll.mockResolvedValue(mockActivities);
    
    const result = await repository.getRecentActivities(userId, limit);
    
    expect(UserActivityLog.findAll).toHaveBeenCalledWith({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit
    });
    expect(result).toEqual(mockActivities);
  });

  test('getActivitiesByEntity should call findAll with correct parameters', async () => {
    const entityType = 'project';
    const entityId = 10;
    const mockActivities = [
      { id: 1, entity_type: entityType, entity_id: entityId },
      { id: 2, entity_type: entityType, entity_id: entityId }
    ];
    
    UserActivityLog.findAll.mockResolvedValue(mockActivities);
    
    const result = await repository.getActivitiesByEntity(entityType, entityId);
    
    expect(UserActivityLog.findAll).toHaveBeenCalledWith({
      where: { entity_type: entityType, entity_id: entityId },
      order: [['created_at', 'DESC']]
    });
    expect(result).toEqual(mockActivities);
  });

  test('getActivitiesByIP should call findAll with correct parameters', async () => {
    const ipAddress = '192.168.1.1';
    const mockActivities = [
      { id: 1, ip_address: ipAddress },
      { id: 2, ip_address: ipAddress }
    ];
    
    UserActivityLog.findAll.mockResolvedValue(mockActivities);
    
    const result = await repository.getActivitiesByIP(ipAddress);
    
    expect(UserActivityLog.findAll).toHaveBeenCalledWith({
      where: { ip_address: ipAddress }
    });
    expect(result).toEqual(mockActivities);
  });
}); 