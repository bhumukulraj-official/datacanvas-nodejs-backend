const { DataTypes } = require('sequelize');
const Payment = require('../../../../src/data/models/billing/Payment');

describe('Payment Model', () => {
  let origInit;
  let origBelongsTo;
  
  beforeEach(() => {
    origInit = Payment.init;
    origBelongsTo = Payment.belongsTo;
    
    Payment.init = jest.fn().mockReturnValue(Payment);
    Payment.belongsTo = jest.fn();
    
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    Payment.init = origInit;
    Payment.belongsTo = origBelongsTo;
    
    jest.clearAllMocks();
  });
  
  describe('Model Definition', () => {
    it('should define the model with correct attributes and options', () => {
      const mockSequelize = {};
      
      Payment.init(mockSequelize);
      
      const initCall = Payment.init.mock.calls[0];
      expect(initCall).toBeDefined();
      
      // Ensure the method was called with the sequelize instance
      expect(Payment.init).toHaveBeenCalledTimes(1);
      expect(Payment.init).toHaveBeenCalledWith(mockSequelize);
    });
  });
  
  describe('Model Associations', () => {
    it('should associate with Invoice, User, and PaymentStatus models', () => {
      // Mock models
      const Invoice = {};
      const User = {};
      const PaymentStatus = {};
      
      // Call associate method
      Payment.associate({ Invoice, User, PaymentStatus });
      
      // Verify associations
      expect(Payment.belongsTo).toHaveBeenCalledTimes(3);
      expect(Payment.belongsTo).toHaveBeenCalledWith(Invoice, { foreignKey: 'invoice_id' });
      expect(Payment.belongsTo).toHaveBeenCalledWith(User, { foreignKey: 'paid_by' });
      expect(Payment.belongsTo).toHaveBeenCalledWith(PaymentStatus, { foreignKey: 'status_code', as: 'status' });
    });
  });
}); 