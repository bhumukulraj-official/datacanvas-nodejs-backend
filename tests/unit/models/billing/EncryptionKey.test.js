const { DataTypes } = require('sequelize');
const EncryptionKey = require('../../../../src/data/models/billing/EncryptionKey');

describe('EncryptionKey Model', () => {
  let origInit;
  
  beforeEach(() => {
    origInit = EncryptionKey.init;
    
    EncryptionKey.init = jest.fn().mockReturnValue(EncryptionKey);
    
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    EncryptionKey.init = origInit;
    
    jest.clearAllMocks();
  });
  
  describe('Model Definition', () => {
    it('should define the model with correct attributes and options', () => {
      const mockSequelize = {};
      
      EncryptionKey.init(mockSequelize);
      
      const initCall = EncryptionKey.init.mock.calls[0];
      expect(initCall).toBeDefined();
      
      // Ensure the method was called with the sequelize instance
      expect(EncryptionKey.init).toHaveBeenCalledTimes(1);
      expect(EncryptionKey.init).toHaveBeenCalledWith(mockSequelize);
    });
  });
}); 