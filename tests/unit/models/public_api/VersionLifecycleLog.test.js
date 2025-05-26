const { DataTypes } = require('sequelize');
const VersionLifecycleLog = require('../../../../src/data/models/public_api/VersionLifecycleLog');

describe('VersionLifecycleLog Model', () => {
  let origInit;
  let origBelongsTo;
  
  beforeEach(() => {
    origInit = VersionLifecycleLog.init;
    origBelongsTo = VersionLifecycleLog.belongsTo;
    
    VersionLifecycleLog.init = jest.fn().mockReturnValue(VersionLifecycleLog);
    VersionLifecycleLog.belongsTo = jest.fn();
    
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    VersionLifecycleLog.init = origInit;
    VersionLifecycleLog.belongsTo = origBelongsTo;
    
    jest.clearAllMocks();
  });
  
  describe('Model Definition', () => {
    it('should define the model with correct attributes and options', () => {
      const mockSequelize = {};
      
      VersionLifecycleLog.init(mockSequelize);
      
      const initCall = VersionLifecycleLog.init.mock.calls[0];
      expect(initCall).toBeDefined();
      
      // Ensure the method was called with the sequelize instance
      expect(VersionLifecycleLog.init).toHaveBeenCalledTimes(1);
      expect(VersionLifecycleLog.init).toHaveBeenCalledWith(mockSequelize);
    });
  });
  
  describe('Model Associations', () => {
    it('should associate with Version model', () => {
      // Mock models
      const Version = {};
      
      // Call associate method
      VersionLifecycleLog.associate({ Version });
      
      // Verify associations
      expect(VersionLifecycleLog.belongsTo).toHaveBeenCalledTimes(1);
      expect(VersionLifecycleLog.belongsTo).toHaveBeenCalledWith(Version, { foreignKey: 'version_id' });
    });
  });
}); 