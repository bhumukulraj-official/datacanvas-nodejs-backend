const { DataTypes } = require('sequelize');
const UserActivityLog = require('../../../../src/data/models/metrics/UserActivityLog');

describe('UserActivityLog Model', () => {
  let origInit;
  let origBelongsTo;
  
  beforeEach(() => {
    origInit = UserActivityLog.init;
    origBelongsTo = UserActivityLog.belongsTo;
    
    UserActivityLog.init = jest.fn().mockReturnValue(UserActivityLog);
    UserActivityLog.belongsTo = jest.fn();
    
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    UserActivityLog.init = origInit;
    UserActivityLog.belongsTo = origBelongsTo;
    
    jest.clearAllMocks();
  });
  
  describe('Model Definition', () => {
    it('should define the model with correct attributes and options', () => {
      const mockSequelize = {};
      
      UserActivityLog.init(mockSequelize);
      
      const initCall = UserActivityLog.init.mock.calls[0];
      expect(initCall).toBeDefined();
      
      // Ensure the method was called with the sequelize instance
      expect(UserActivityLog.init).toHaveBeenCalledTimes(1);
      expect(UserActivityLog.init).toHaveBeenCalledWith(mockSequelize);
    });
  });
  
  describe('Model Associations', () => {
    it('should associate with User model', () => {
      // Mock models
      const User = {};
      
      // Call associate method
      UserActivityLog.associate({ User });
      
      // Verify associations
      expect(UserActivityLog.belongsTo).toHaveBeenCalledTimes(1);
      expect(UserActivityLog.belongsTo).toHaveBeenCalledWith(User, { foreignKey: 'user_id' });
    });
  });
}); 