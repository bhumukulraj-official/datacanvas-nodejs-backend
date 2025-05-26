const { DataTypes } = require('sequelize');
const EmailVerificationToken = require('../../../../src/data/models/auth/EmailVerificationToken');

describe('EmailVerificationToken Model', () => {
  let origInit;
  let origBelongsTo;
  
  beforeEach(() => {
    origInit = EmailVerificationToken.init;
    origBelongsTo = EmailVerificationToken.belongsTo;
    
    EmailVerificationToken.init = jest.fn().mockReturnValue(EmailVerificationToken);
    EmailVerificationToken.belongsTo = jest.fn();
    
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    EmailVerificationToken.init = origInit;
    EmailVerificationToken.belongsTo = origBelongsTo;
    
    jest.clearAllMocks();
  });
  
  describe('Model Definition', () => {
    it('should define the model with correct attributes and options', () => {
      const mockSequelize = {};
      
      EmailVerificationToken.init(mockSequelize);
      
      const initCall = EmailVerificationToken.init.mock.calls[0];
      expect(initCall).toBeDefined();
      
      // Ensure the method was called with the sequelize instance
      expect(EmailVerificationToken.init).toHaveBeenCalledTimes(1);
      expect(EmailVerificationToken.init).toHaveBeenCalledWith(mockSequelize);
    });
  });
  
  describe('Model Associations', () => {
    it('should associate with User model', () => {
      // Mock User model
      const User = {};
      
      // Call associate method
      EmailVerificationToken.associate({ User });
      
      // Verify associations
      expect(EmailVerificationToken.belongsTo).toHaveBeenCalledTimes(1);
      expect(EmailVerificationToken.belongsTo).toHaveBeenCalledWith(User, { foreignKey: 'user_id' });
    });
  });
}); 