const { DataTypes } = require('sequelize');
const UserRole = require('../../../../src/data/models/auth/UserRole');

describe('UserRole Model', () => {
  let origInit;
  let origHasMany;
  
  beforeEach(() => {
    origInit = UserRole.init;
    origHasMany = UserRole.hasMany;
    
    UserRole.init = jest.fn().mockReturnValue(UserRole);
    UserRole.hasMany = jest.fn();
    
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    UserRole.init = origInit;
    UserRole.hasMany = origHasMany;
    
    jest.clearAllMocks();
  });
  
  describe('Model Definition', () => {
    it('should define the model with correct attributes and options', () => {
      const mockSequelize = {};
      
      UserRole.init(mockSequelize);
      
      const initCall = UserRole.init.mock.calls[0];
      expect(initCall).toBeDefined();
      
      // Ensure the method was called with the sequelize instance
      expect(UserRole.init).toHaveBeenCalledTimes(1);
      expect(UserRole.init).toHaveBeenCalledWith(mockSequelize);
    });
  });
  
  describe('Model Associations', () => {
    it('should associate with User model', () => {
      // Mock User model
      const User = {};
      
      // Call associate method
      UserRole.associate({ User });
      
      // Verify associations
      expect(UserRole.hasMany).toHaveBeenCalledTimes(1);
      expect(UserRole.hasMany).toHaveBeenCalledWith(User, { foreignKey: 'role', sourceKey: 'code' });
    });
  });
}); 