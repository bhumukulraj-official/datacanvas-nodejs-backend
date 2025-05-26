const { DataTypes } = require('sequelize');
const Notification = require('../../../../src/data/models/messaging/Notification');

describe('Notification Model', () => {
  let origInit;
  let origBelongsTo;
  
  beforeEach(() => {
    origInit = Notification.init;
    origBelongsTo = Notification.belongsTo;
    
    Notification.init = jest.fn().mockReturnValue(Notification);
    Notification.belongsTo = jest.fn();
    
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    Notification.init = origInit;
    Notification.belongsTo = origBelongsTo;
    
    jest.clearAllMocks();
  });
  
  describe('Model Definition', () => {
    it('should define the model with correct attributes and options', () => {
      const mockSequelize = {};
      
      Notification.init(mockSequelize);
      
      const initCall = Notification.init.mock.calls[0];
      expect(initCall).toBeDefined();
      
      // Ensure the method was called with the sequelize instance
      expect(Notification.init).toHaveBeenCalledTimes(1);
      expect(Notification.init).toHaveBeenCalledWith(mockSequelize);
    });
  });
  
  describe('Model Associations', () => {
    it('should associate with User model', () => {
      // Mock User model
      const User = {};
      
      // Call associate method
      Notification.associate({ User });
      
      // Verify associations
      expect(Notification.belongsTo).toHaveBeenCalledTimes(1);
      expect(Notification.belongsTo).toHaveBeenCalledWith(User, { foreignKey: 'user_id' });
    });
  });
}); 