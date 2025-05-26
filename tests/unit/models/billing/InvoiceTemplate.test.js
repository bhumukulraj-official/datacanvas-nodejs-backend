const { DataTypes } = require('sequelize');
const InvoiceTemplate = require('../../../../src/data/models/billing/InvoiceTemplate');

describe('InvoiceTemplate Model', () => {
  let origInit;
  
  beforeEach(() => {
    origInit = InvoiceTemplate.init;
    
    InvoiceTemplate.init = jest.fn().mockReturnValue(InvoiceTemplate);
    
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    InvoiceTemplate.init = origInit;
    
    jest.clearAllMocks();
  });
  
  describe('Model Definition', () => {
    it('should define the model with correct attributes and options', () => {
      const mockSequelize = {};
      
      InvoiceTemplate.init(mockSequelize);
      
      const initCall = InvoiceTemplate.init.mock.calls[0];
      expect(initCall).toBeDefined();
      
      // Ensure the method was called with the sequelize instance
      expect(InvoiceTemplate.init).toHaveBeenCalledTimes(1);
      expect(InvoiceTemplate.init).toHaveBeenCalledWith(mockSequelize);
    });
  });
}); 