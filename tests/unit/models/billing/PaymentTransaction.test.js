const { DataTypes } = require('sequelize');
const PaymentTransaction = require('../../../../src/data/models/billing/PaymentTransaction');

describe('PaymentTransaction Model', () => {
  let origInit;
  let origBelongsTo;
  
  beforeEach(() => {
    origInit = PaymentTransaction.init;
    origBelongsTo = PaymentTransaction.belongsTo;
    
    PaymentTransaction.init = jest.fn().mockReturnValue(PaymentTransaction);
    PaymentTransaction.belongsTo = jest.fn();
    
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    PaymentTransaction.init = origInit;
    PaymentTransaction.belongsTo = origBelongsTo;
    
    jest.clearAllMocks();
  });
  
  describe('Model Definition', () => {
    it('should define the model with correct attributes and options', () => {
      const mockSequelize = {};
      
      PaymentTransaction.init(mockSequelize);
      
      const initCall = PaymentTransaction.init.mock.calls[0];
      expect(initCall).toBeDefined();
      
      // Ensure the method was called with the sequelize instance
      expect(PaymentTransaction.init).toHaveBeenCalledTimes(1);
      expect(PaymentTransaction.init).toHaveBeenCalledWith(mockSequelize);
    });
  });
  
  describe('Model Associations', () => {
    it('should associate with Invoice and PaymentGateway models', () => {
      // Mock models
      const Invoice = {};
      const PaymentGateway = {};
      
      // Call associate method
      PaymentTransaction.associate({ Invoice, PaymentGateway });
      
      // Verify associations
      expect(PaymentTransaction.belongsTo).toHaveBeenCalledTimes(2);
      expect(PaymentTransaction.belongsTo).toHaveBeenCalledWith(Invoice, { foreignKey: 'invoice_id' });
      expect(PaymentTransaction.belongsTo).toHaveBeenCalledWith(PaymentGateway, { foreignKey: 'gateway_id' });
    });
  });
}); 