const { DataTypes } = require('sequelize');
const StorageProvider = require('../../../../src/data/models/content/StorageProvider');

describe('StorageProvider Model', () => {
  let origInit;
  let origHasMany;
  
  beforeEach(() => {
    origInit = StorageProvider.init;
    origHasMany = StorageProvider.hasMany;
    
    StorageProvider.init = jest.fn().mockReturnValue(StorageProvider);
    StorageProvider.hasMany = jest.fn();
    
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    StorageProvider.init = origInit;
    StorageProvider.hasMany = origHasMany;
    
    jest.clearAllMocks();
  });
  
  describe('Model Definition', () => {
    it('should define the model with correct attributes and options', () => {
      const mockSequelize = {};
      
      StorageProvider.init(mockSequelize);
      
      const initCall = StorageProvider.init.mock.calls[0];
      expect(initCall).toBeDefined();
      
      // Ensure the method was called with the sequelize instance
      expect(StorageProvider.init).toHaveBeenCalledTimes(1);
      expect(StorageProvider.init).toHaveBeenCalledWith(mockSequelize);
    });
  });
  
  describe('Model Associations', () => {
    it('should associate with FileUpload model', () => {
      // Mock FileUpload model
      const FileUpload = {};
      
      // Call associate method
      StorageProvider.associate({ FileUpload });
      
      // Verify associations
      expect(StorageProvider.hasMany).toHaveBeenCalledTimes(1);
      expect(StorageProvider.hasMany).toHaveBeenCalledWith(FileUpload, { foreignKey: 'storage_provider_id', as: 'files' });
    });
  });
}); 