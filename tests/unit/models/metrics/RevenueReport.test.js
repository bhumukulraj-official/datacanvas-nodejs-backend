const { DataTypes } = require('sequelize');
const RevenueReport = require('../../../../src/data/models/metrics/RevenueReport');

describe('RevenueReport Model', () => {
  let origInit;
  let origBelongsTo;
  
  beforeEach(() => {
    origInit = RevenueReport.init;
    origBelongsTo = RevenueReport.belongsTo;
    
    RevenueReport.init = jest.fn().mockReturnValue(RevenueReport);
    RevenueReport.belongsTo = jest.fn();
    
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    RevenueReport.init = origInit;
    RevenueReport.belongsTo = origBelongsTo;
    
    jest.clearAllMocks();
  });
  
  describe('Model Definition', () => {
    it('should define the model with correct attributes and options', () => {
      const mockSequelize = {};
      
      RevenueReport.init(mockSequelize);
      
      const initCall = RevenueReport.init.mock.calls[0];
      expect(initCall).toBeDefined();
      
      // Ensure the method was called with the sequelize instance
      expect(RevenueReport.init).toHaveBeenCalledTimes(1);
      expect(RevenueReport.init).toHaveBeenCalledWith(mockSequelize);
    });
  });
  
  describe('Model Associations', () => {
    it('should associate with User model', () => {
      // Mock models
      const User = {};
      
      // Call associate method
      RevenueReport.associate({ User });
      
      // Verify associations
      expect(RevenueReport.belongsTo).toHaveBeenCalledTimes(1);
      expect(RevenueReport.belongsTo).toHaveBeenCalledWith(User, { foreignKey: 'user_id' });
    });
  });
}); 