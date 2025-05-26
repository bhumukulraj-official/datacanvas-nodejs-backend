const VersionLifecycleLogRepository = require('../../../../src/data/repositories/public_api/VersionLifecycleLogRepository');
const VersionLifecycleLog = require('../../../../src/data/models/public_api/VersionLifecycleLog');

// Mock the model
jest.mock('../../../../src/data/models/public_api/VersionLifecycleLog', () => ({
  findAll: jest.fn(),
  create: jest.fn()
}));

describe('VersionLifecycleLogRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('findByVersion should call findAll with correct parameters', async () => {
    const version = 'v1';
    const mockLogs = [
      { id: 1, version, action: 'created' },
      { id: 2, version, action: 'deprecated' }
    ];
    
    VersionLifecycleLog.findAll.mockResolvedValue(mockLogs);
    
    const result = await VersionLifecycleLogRepository.findByVersion(version);
    
    expect(VersionLifecycleLog.findAll).toHaveBeenCalledWith({
      where: { version },
      order: [['performed_at', 'DESC']]
    });
    expect(result).toEqual(mockLogs);
  });

  test('findByAction should call findAll with correct parameters', async () => {
    const action = 'deprecated';
    const mockLogs = [
      { id: 1, version: 'v1', action },
      { id: 2, version: 'v2', action }
    ];
    
    VersionLifecycleLog.findAll.mockResolvedValue(mockLogs);
    
    const result = await VersionLifecycleLogRepository.findByAction(action);
    
    expect(VersionLifecycleLog.findAll).toHaveBeenCalledWith({
      where: { action },
      order: [['performed_at', 'DESC']]
    });
    expect(result).toEqual(mockLogs);
  });

  test('logAction should call create with correct parameters', async () => {
    const version = 'v1';
    const action = 'deprecated';
    const details = { reason: 'New version available' };
    const performedBy = 'admin';
    
    const mockLog = { 
      id: 1, 
      version, 
      action, 
      details, 
      performed_by: performedBy,
      performed_at: expect.any(Date)
    };
    
    VersionLifecycleLog.create.mockResolvedValue(mockLog);
    
    // Mock Date for consistent testing
    const now = new Date();
    jest.spyOn(global, 'Date').mockImplementation(() => now);
    
    const result = await VersionLifecycleLogRepository.logAction(version, action, details, performedBy);
    
    expect(VersionLifecycleLog.create).toHaveBeenCalledWith({
      version,
      action,
      details,
      performed_by: performedBy,
      performed_at: now
    });
    expect(result).toEqual(mockLog);
    
    // Restore Date mock
    global.Date.mockRestore();
  });

  test('getVersionHistory should call findAll with correct parameters', async () => {
    const version = 'v1';
    const mockLogs = [
      { id: 1, version, action: 'created' },
      { id: 2, version, action: 'deprecated' }
    ];
    
    VersionLifecycleLog.findAll.mockResolvedValue(mockLogs);
    
    const result = await VersionLifecycleLogRepository.getVersionHistory(version);
    
    expect(VersionLifecycleLog.findAll).toHaveBeenCalledWith({
      where: { version },
      order: [['performed_at', 'ASC']],
      include: [{ association: 'Version' }]
    });
    expect(result).toEqual(mockLogs);
  });
}); 