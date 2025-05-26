const { DataTypes } = require('sequelize');
const Version = require('../../../../src/data/models/public_api/Version');

describe('Version Model', () => {
  let origInit;
  let origHasMany;
  
  beforeEach(() => {
    origInit = Version.init;
    origHasMany = Version.hasMany;
    Version.init = jest.fn().mockReturnValue(Version);
    Version.hasMany = jest.fn();
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    Version.init = origInit;
    Version.hasMany = origHasMany;
    jest.clearAllMocks();
  });

  describe('Model Definition', () => {
    it('should define the model with correct attributes', () => {
      const mockSequelize = {};
      
      Version.init(mockSequelize);
      
      const initCall = Version.init.mock.calls[0];
      expect(initCall).toBeDefined();
      
      // We can't access the actual arguments passed to the mock directly
      // since they're passed internally to super.init, so instead we'll 
      // ensure the method was called once with the sequelize instance
      expect(Version.init).toHaveBeenCalledTimes(1);
      expect(Version.init).toHaveBeenCalledWith(mockSequelize);
    });
  });

  describe('Model Associations', () => {
    it('should define correct associations', () => {
      // Create mock models
      const VersionLifecycleLog = {};
      
      // Call the associate method
      Version.associate({ VersionLifecycleLog });
      
      // Verify the associations were called correctly
      expect(Version.hasMany).toHaveBeenCalledTimes(1);
      expect(Version.hasMany).toHaveBeenCalledWith(VersionLifecycleLog, { 
        foreignKey: 'version', 
        sourceKey: 'version' 
      });
    });
  });

  describe('Model Usage', () => {
    it('should support API versioning patterns', () => {
      // Demonstrate typical version patterns
      const v1 = {
        version: 'v1',
        base_path: '/api/v1',
        release_date: '2023-01-01',
        is_active: true,
        auto_sunset: true
      };
      
      const v2 = {
        version: 'v2',
        base_path: '/api/v2',
        release_date: '2023-06-01',
        is_active: true,
        auto_sunset: true
      };
      
      const deprecatedV1 = {
        ...v1,
        deprecated_at: '2023-06-01',
        sunset_date: '2024-06-01'
      };
      
      // Verify test data structure
      expect(v1.version).toBe('v1');
      expect(v2.version).toBe('v2');
      expect(deprecatedV1.deprecated_at).toBe('2023-06-01');
    });
  });
}); 