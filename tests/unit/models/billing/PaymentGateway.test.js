const { DataTypes } = require('sequelize');
const PaymentGateway = require('../../../../src/data/models/billing/PaymentGateway');

describe('PaymentGateway Model', () => {
  let origInit;
  let origBelongsTo;
  
  beforeEach(() => {
    origInit = PaymentGateway.init;
    origBelongsTo = PaymentGateway.belongsTo;
    
    PaymentGateway.init = jest.fn().mockReturnValue(PaymentGateway);
    PaymentGateway.belongsTo = jest.fn();
    
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    PaymentGateway.init = origInit;
    PaymentGateway.belongsTo = origBelongsTo;
    
    jest.clearAllMocks();
  });
  
  describe('Model Definition', () => {
    it('should define the model with correct attributes and options', () => {
      const mockSequelize = {};
      
      PaymentGateway.init(mockSequelize);
      
      const initCall = PaymentGateway.init.mock.calls[0];
      expect(initCall).toBeDefined();
      
      // Ensure the method was called with the sequelize instance
      expect(PaymentGateway.init).toHaveBeenCalledTimes(1);
      expect(PaymentGateway.init).toHaveBeenCalledWith(mockSequelize);
    });
  });
  
  describe('Model Associations', () => {
    it('should associate with PaymentProvider model', () => {
      // Mock PaymentProvider model
      const PaymentProvider = {};
      
      // Call associate method
      PaymentGateway.associate({ PaymentProvider });
      
      // Verify associations
      expect(PaymentGateway.belongsTo).toHaveBeenCalledTimes(1);
      expect(PaymentGateway.belongsTo).toHaveBeenCalledWith(PaymentProvider, { foreignKey: 'provider_code', as: 'provider' });
    });
  });
}); 