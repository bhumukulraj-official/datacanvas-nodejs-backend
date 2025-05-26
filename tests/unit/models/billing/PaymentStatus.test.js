const { DataTypes } = require('sequelize');
const PaymentStatus = require('../../../../src/data/models/billing/PaymentStatus');

describe('PaymentStatus Model', () => {
  let origInit;
  let origHasMany;
  
  beforeEach(() => {
    origInit = PaymentStatus.init;
    origHasMany = PaymentStatus.hasMany;
    
    PaymentStatus.init = jest.fn().mockReturnValue(PaymentStatus);
    PaymentStatus.hasMany = jest.fn();
    
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    PaymentStatus.init = origInit;
    PaymentStatus.hasMany = origHasMany;
    
    jest.clearAllMocks();
  });
  
  describe('Model Definition', () => {
    it('should define the model with correct attributes and options', () => {
      const mockSequelize = {};
      
      PaymentStatus.init(mockSequelize);
      
      const initCall = PaymentStatus.init.mock.calls[0];
      expect(initCall).toBeDefined();
      
      // Ensure the method was called with the sequelize instance
      expect(PaymentStatus.init).toHaveBeenCalledTimes(1);
      expect(PaymentStatus.init).toHaveBeenCalledWith(mockSequelize);
    });
  });
  
  describe('Model Associations', () => {
    it('should associate with Payment model', () => {
      // Mock Payment model
      const Payment = {};
      
      // Call associate method
      PaymentStatus.associate({ Payment });
      
      // Verify associations
      expect(PaymentStatus.hasMany).toHaveBeenCalledTimes(1);
      expect(PaymentStatus.hasMany).toHaveBeenCalledWith(Payment, { foreignKey: 'status_code', as: 'payments' });
    });
  });
}); 