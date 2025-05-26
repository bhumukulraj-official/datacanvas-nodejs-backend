const { DataTypes } = require('sequelize');
const PaymentProvider = require('../../../../src/data/models/billing/PaymentProvider');

describe('PaymentProvider Model', () => {
  let origInit;
  let origHasMany;
  
  beforeEach(() => {
    origInit = PaymentProvider.init;
    origHasMany = PaymentProvider.hasMany;
    
    PaymentProvider.init = jest.fn().mockReturnValue(PaymentProvider);
    PaymentProvider.hasMany = jest.fn();
    
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    PaymentProvider.init = origInit;
    PaymentProvider.hasMany = origHasMany;
    
    jest.clearAllMocks();
  });
  
  describe('Model Definition', () => {
    it('should define the model with correct attributes and options', () => {
      const mockSequelize = {};
      
      PaymentProvider.init(mockSequelize);
      
      const initCall = PaymentProvider.init.mock.calls[0];
      expect(initCall).toBeDefined();
      
      // Ensure the method was called with the sequelize instance
      expect(PaymentProvider.init).toHaveBeenCalledTimes(1);
      expect(PaymentProvider.init).toHaveBeenCalledWith(mockSequelize);
    });
  });
  
  describe('Model Associations', () => {
    it('should associate with PaymentGateway and Webhook models', () => {
      // Mock models
      const PaymentGateway = {};
      const Webhook = {};
      
      // Call associate method
      PaymentProvider.associate({ PaymentGateway, Webhook });
      
      // Verify associations
      expect(PaymentProvider.hasMany).toHaveBeenCalledTimes(2);
      expect(PaymentProvider.hasMany).toHaveBeenCalledWith(PaymentGateway, { foreignKey: 'provider', sourceKey: 'code' });
      expect(PaymentProvider.hasMany).toHaveBeenCalledWith(Webhook, { foreignKey: 'provider', sourceKey: 'code' });
    });
  });
}); 