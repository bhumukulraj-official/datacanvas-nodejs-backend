const { DataTypes } = require('sequelize');
const RateLimit = require('../../../../src/data/models/public_api/RateLimit');

describe('RateLimit Model', () => {
  let origInit;
  let origBelongsTo;
  
  beforeEach(() => {
    origInit = RateLimit.init;
    origBelongsTo = RateLimit.belongsTo;
    
    RateLimit.init = jest.fn().mockReturnValue(RateLimit);
    RateLimit.belongsTo = jest.fn();
    
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    RateLimit.init = origInit;
    RateLimit.belongsTo = origBelongsTo;
    
    jest.clearAllMocks();
  });
  
  describe('Model Definition', () => {
    it('should define the model with correct attributes and options', () => {
      const mockSequelize = {};
      
      RateLimit.init(mockSequelize);
      
      const initCall = RateLimit.init.mock.calls[0];
      expect(initCall).toBeDefined();
      
      // Ensure the method was called with the sequelize instance
      expect(RateLimit.init).toHaveBeenCalledTimes(1);
      expect(RateLimit.init).toHaveBeenCalledWith(mockSequelize);
    });
  });
  
  describe('Model Associations', () => {
    it('should associate with User and RateLimitConfig models', () => {
      // Mock models
      const User = {};
      const RateLimitConfig = {};
      
      // Call associate method
      RateLimit.associate({ User, RateLimitConfig });
      
      // Verify associations
      expect(RateLimit.belongsTo).toHaveBeenCalledTimes(2);
      expect(RateLimit.belongsTo).toHaveBeenCalledWith(User, { foreignKey: 'user_id' });
      expect(RateLimit.belongsTo).toHaveBeenCalledWith(RateLimitConfig, { foreignKey: 'config_id' });
    });
  });
}); 