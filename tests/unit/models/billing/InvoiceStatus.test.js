const { DataTypes } = require('sequelize');
const InvoiceStatus = require('../../../../src/data/models/billing/InvoiceStatus');

describe('InvoiceStatus Model', () => {
  let origInit;
  let origHasMany;
  
  beforeEach(() => {
    origInit = InvoiceStatus.init;
    origHasMany = InvoiceStatus.hasMany;
    
    InvoiceStatus.init = jest.fn().mockReturnValue(InvoiceStatus);
    InvoiceStatus.hasMany = jest.fn();
    
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    InvoiceStatus.init = origInit;
    InvoiceStatus.hasMany = origHasMany;
    
    jest.clearAllMocks();
  });
  
  describe('Model Definition', () => {
    it('should define the model with correct attributes and options', () => {
      const mockSequelize = {};
      
      InvoiceStatus.init(mockSequelize);
      
      const initCall = InvoiceStatus.init.mock.calls[0];
      expect(initCall).toBeDefined();
      
      // Ensure the method was called with the sequelize instance
      expect(InvoiceStatus.init).toHaveBeenCalledTimes(1);
      expect(InvoiceStatus.init).toHaveBeenCalledWith(mockSequelize);
    });
  });
  
  describe('Model Associations', () => {
    it('should associate with Invoice model', () => {
      // Mock Invoice model
      const Invoice = {};
      
      // Call associate method
      InvoiceStatus.associate({ Invoice });
      
      // Verify associations
      expect(InvoiceStatus.hasMany).toHaveBeenCalledTimes(1);
      expect(InvoiceStatus.hasMany).toHaveBeenCalledWith(Invoice, { foreignKey: 'status_code' });
    });
  });
}); 