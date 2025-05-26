const VersionRepository = require('../../../../src/data/repositories/public_api/VersionRepository');
const Version = require('../../../../src/data/models/public_api/Version');
const { Op } = require('sequelize');

// Mock the model
jest.mock('../../../../src/data/models/public_api/Version', () => ({
  findOne: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn()
}));

// Mock sequelize Op
jest.mock('sequelize', () => ({
  Op: {
    not: Symbol('not'),
    gt: Symbol('gt'),
    lte: Symbol('lte')
  }
}));

describe('VersionRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('findByVersion should call findOne with correct parameters', async () => {
    const version = 'v1';
    const mockVersion = { id: 1, version, is_active: true };
    
    Version.findOne.mockResolvedValue(mockVersion);
    
    const result = await VersionRepository.findByVersion(version);
    
    expect(Version.findOne).toHaveBeenCalledWith({
      where: { version }
    });
    expect(result).toEqual(mockVersion);
  });

  test('findActiveVersions should call findAll with correct parameters', async () => {
    const mockVersions = [
      { id: 1, version: 'v1', is_active: true },
      { id: 2, version: 'v2', is_active: true }
    ];
    
    Version.findAll.mockResolvedValue(mockVersions);
    
    const result = await VersionRepository.findActiveVersions();
    
    expect(Version.findAll).toHaveBeenCalledWith({
      where: { is_active: true },
      order: [['version', 'DESC']]
    });
    expect(result).toEqual(mockVersions);
  });

  test('findDeprecatedVersions should call findAll with correct parameters', async () => {
    const mockVersions = [
      { id: 1, version: 'v1', deprecated_at: new Date(), sunset_date: new Date('2023-12-31') }
    ];
    
    Version.findAll.mockResolvedValue(mockVersions);
    
    // Mock Date for consistent testing
    const now = new Date();
    jest.spyOn(global, 'Date').mockImplementation(() => now);
    
    const result = await VersionRepository.findDeprecatedVersions();
    
    expect(Version.findAll).toHaveBeenCalledWith({
      where: { 
        deprecated_at: {
          [Op.not]: null
        },
        sunset_date: {
          [Op.gt]: now
        }
      },
      order: [['sunset_date', 'ASC']]
    });
    expect(result).toEqual(mockVersions);
    
    // Restore Date mock
    global.Date.mockRestore();
  });

  test('findSunsetVersions should call findAll with correct parameters', async () => {
    const mockVersions = [
      { id: 1, version: 'v1', sunset_date: new Date('2022-12-31') }
    ];
    
    Version.findAll.mockResolvedValue(mockVersions);
    
    // Mock Date for consistent testing
    const now = new Date();
    jest.spyOn(global, 'Date').mockImplementation(() => now);
    
    const result = await VersionRepository.findSunsetVersions();
    
    expect(Version.findAll).toHaveBeenCalledWith({
      where: { 
        sunset_date: {
          [Op.lte]: now
        }
      },
      order: [['sunset_date', 'DESC']]
    });
    expect(result).toEqual(mockVersions);
    
    // Restore Date mock
    global.Date.mockRestore();
  });

  test('deprecateVersion should call update with correct parameters', async () => {
    const version = 'v1';
    const sunsetDate = new Date('2023-12-31');
    const updateResult = [1]; // Number of affected rows
    
    Version.update.mockResolvedValue(updateResult);
    
    // Mock Date for consistent testing
    const now = new Date();
    jest.spyOn(global, 'Date').mockImplementation(() => now);
    
    const result = await VersionRepository.deprecateVersion(version, sunsetDate);
    
    expect(Version.update).toHaveBeenCalledWith(
      { 
        deprecated_at: now,
        sunset_date: sunsetDate
      },
      { where: { version } }
    );
    expect(result).toEqual(updateResult);
    
    // Restore Date mock
    global.Date.mockRestore();
  });

  test('toggleActive should call update with correct parameters', async () => {
    const version = 'v1';
    const isActive = false;
    const updateResult = [1]; // Number of affected rows
    
    Version.update.mockResolvedValue(updateResult);
    
    const result = await VersionRepository.toggleActive(version, isActive);
    
    expect(Version.update).toHaveBeenCalledWith(
      { is_active: isActive },
      { where: { version } }
    );
    expect(result).toEqual(updateResult);
  });
}); 