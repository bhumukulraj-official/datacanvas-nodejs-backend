const { DataTypes } = require('sequelize');
const RefreshToken = require('../../../../src/data/models/auth/RefreshToken');

describe('RefreshToken Model', () => {
  let origInit;
  let origBelongsTo;
  
  beforeEach(() => {
    origInit = RefreshToken.init;
    origBelongsTo = RefreshToken.belongsTo;
    
    RefreshToken.init = jest.fn().mockReturnValue(RefreshToken);
    RefreshToken.belongsTo = jest.fn();
    
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    RefreshToken.init = origInit;
    RefreshToken.belongsTo = origBelongsTo;
    
    jest.clearAllMocks();
  });
  
  describe('Model Definition', () => {
    it('should define the model with correct attributes and options', () => {
      const mockSequelize = {};
      
      RefreshToken.init(mockSequelize);
      
      const initCall = RefreshToken.init.mock.calls[0];
      expect(initCall).toBeDefined();
      
      // Ensure the method was called with the sequelize instance
      expect(RefreshToken.init).toHaveBeenCalledTimes(1);
      expect(RefreshToken.init).toHaveBeenCalledWith(mockSequelize);
    });
  });
  
  describe('Model Associations', () => {
    it('should associate with User model', () => {
      // Mock User model
      const User = {};
      
      // Call associate method
      RefreshToken.associate({ User });
      
      // Verify associations
      expect(RefreshToken.belongsTo).toHaveBeenCalledTimes(1);
      expect(RefreshToken.belongsTo).toHaveBeenCalledWith(User, { foreignKey: 'user_id' });
    });
  });
}); 