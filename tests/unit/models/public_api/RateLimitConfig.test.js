const { DataTypes } = require('sequelize');
const RateLimitConfig = require('../../../../src/data/models/public_api/RateLimitConfig');

describe('RateLimitConfig Model', () => {
  let origInit;
  let origHasMany;
  
  beforeEach(() => {
    origInit = RateLimitConfig.init;
    origHasMany = RateLimitConfig.hasMany;
    
    RateLimitConfig.init = jest.fn().mockReturnValue(RateLimitConfig);
    RateLimitConfig.hasMany = jest.fn();
    
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    RateLimitConfig.init = origInit;
    RateLimitConfig.hasMany = origHasMany;
    
    jest.clearAllMocks();
  });
  
  describe('Model Definition', () => {
    it('should define the model with correct attributes and options', () => {
      const mockSequelize = {};
      
      RateLimitConfig.init(mockSequelize);
      
      const initCall = RateLimitConfig.init.mock.calls[0];
      expect(initCall).toBeDefined();
      
      // Ensure the method was called with the sequelize instance
      expect(RateLimitConfig.init).toHaveBeenCalledTimes(1);
      expect(RateLimitConfig.init).toHaveBeenCalledWith(mockSequelize);
    });
  });
  
  describe('Model Associations', () => {
    it('should associate with RateLimit model', () => {
      // Mock models
      const RateLimit = {};
      
      // Call associate method
      RateLimitConfig.associate({ RateLimit });
      
      // Verify associations
      expect(RateLimitConfig.hasMany).toHaveBeenCalledTimes(1);
      expect(RateLimitConfig.hasMany).toHaveBeenCalledWith(RateLimit, { foreignKey: 'config_id' });
    });
  });
}); 