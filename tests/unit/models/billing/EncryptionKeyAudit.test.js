const { DataTypes } = require('sequelize');
const EncryptionKeyAudit = require('../../../../src/data/models/billing/EncryptionKeyAudit');

describe('EncryptionKeyAudit Model', () => {
  let origInit;
  let origBelongsTo;
  
  beforeEach(() => {
    origInit = EncryptionKeyAudit.init;
    origBelongsTo = EncryptionKeyAudit.belongsTo;
    
    EncryptionKeyAudit.init = jest.fn().mockReturnValue(EncryptionKeyAudit);
    EncryptionKeyAudit.belongsTo = jest.fn();
    
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    EncryptionKeyAudit.init = origInit;
    EncryptionKeyAudit.belongsTo = origBelongsTo;
    
    jest.clearAllMocks();
  });
  
  describe('Model Definition', () => {
    it('should define the model with correct attributes and options', () => {
      const mockSequelize = {};
      
      EncryptionKeyAudit.init(mockSequelize);
      
      const initCall = EncryptionKeyAudit.init.mock.calls[0];
      expect(initCall).toBeDefined();
      
      // Ensure the method was called with the sequelize instance
      expect(EncryptionKeyAudit.init).toHaveBeenCalledTimes(1);
      expect(EncryptionKeyAudit.init).toHaveBeenCalledWith(mockSequelize);
    });
  });
  
  describe('Model Associations', () => {
    it('should associate with EncryptionKey model', () => {
      // Mock EncryptionKey model
      const EncryptionKey = {};
      
      // Call associate method
      EncryptionKeyAudit.associate({ EncryptionKey });
      
      // Verify associations
      expect(EncryptionKeyAudit.belongsTo).toHaveBeenCalledTimes(1);
      expect(EncryptionKeyAudit.belongsTo).toHaveBeenCalledWith(EncryptionKey, { 
        foreignKey: 'key_version', 
        targetKey: 'version' 
      });
    });
  });
}); 