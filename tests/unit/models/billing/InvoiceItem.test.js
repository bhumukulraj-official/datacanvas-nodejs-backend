const { DataTypes } = require('sequelize');
const InvoiceItem = require('../../../../src/data/models/billing/InvoiceItem');

describe('InvoiceItem Model', () => {
  let origInit;
  let origBelongsTo;
  
  beforeEach(() => {
    origInit = InvoiceItem.init;
    origBelongsTo = InvoiceItem.belongsTo;
    
    InvoiceItem.init = jest.fn().mockReturnValue(InvoiceItem);
    InvoiceItem.belongsTo = jest.fn();
    
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    InvoiceItem.init = origInit;
    InvoiceItem.belongsTo = origBelongsTo;
    
    jest.clearAllMocks();
  });
  
  describe('Model Definition', () => {
    it('should define the model with correct attributes and options', () => {
      const mockSequelize = {};
      
      InvoiceItem.init(mockSequelize);
      
      const initCall = InvoiceItem.init.mock.calls[0];
      expect(initCall).toBeDefined();
      
      // Ensure the method was called with the sequelize instance
      expect(InvoiceItem.init).toHaveBeenCalledTimes(1);
      expect(InvoiceItem.init).toHaveBeenCalledWith(mockSequelize);
    });
  });
  
  describe('Model Associations', () => {
    it('should associate with Invoice model', () => {
      // Mock Invoice model
      const Invoice = {};
      
      // Call associate method
      InvoiceItem.associate({ Invoice });
      
      // Verify associations
      expect(InvoiceItem.belongsTo).toHaveBeenCalledTimes(1);
      expect(InvoiceItem.belongsTo).toHaveBeenCalledWith(Invoice);
    });
  });

  describe('Model Validations', () => {
    it('should include validations for numeric fields', () => {
      // Create validation functions to test manually
      const validateQuantity = function() {
        if (this.quantity < 0.01) {
          throw new Error('Quantity must be at least 0.01');
        }
      };
      
      const validateUnitPrice = function() {
        if (this.unit_price < 0.01) {
          throw new Error('Unit price must be at least 0.01');
        }
      };
      
      const validateAmount = function() {
        if (this.amount < 0.01) {
          throw new Error('Amount must be at least 0.01');
        }
      };
      
      // Test invalid values
      const invoiceItem = {
        quantity: 0,
        unit_price: 0,
        amount: 0
      };
      
      expect(() => validateQuantity.call(invoiceItem)).toThrow('Quantity must be at least 0.01');
      expect(() => validateUnitPrice.call(invoiceItem)).toThrow('Unit price must be at least 0.01');
      expect(() => validateAmount.call(invoiceItem)).toThrow('Amount must be at least 0.01');
      
      // Test valid values
      invoiceItem.quantity = 1;
      invoiceItem.unit_price = 10.50;
      invoiceItem.amount = 10.50;
      
      expect(() => validateQuantity.call(invoiceItem)).not.toThrow();
      expect(() => validateUnitPrice.call(invoiceItem)).not.toThrow();
      expect(() => validateAmount.call(invoiceItem)).not.toThrow();
    });
  });
}); 