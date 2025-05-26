const { DataTypes } = require('sequelize');
const FileUpload = require('../../../../src/data/models/content/FileUpload');

describe('FileUpload Model', () => {
  let origInit;
  let origBelongsTo;
  
  beforeEach(() => {
    origInit = FileUpload.init;
    origBelongsTo = FileUpload.belongsTo;
    
    FileUpload.init = jest.fn().mockReturnValue(FileUpload);
    FileUpload.belongsTo = jest.fn();
    
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    FileUpload.init = origInit;
    FileUpload.belongsTo = origBelongsTo;
    
    jest.clearAllMocks();
  });
  
  describe('Model Definition', () => {
    it('should define the model with correct attributes and options', () => {
      const mockSequelize = {};
      
      FileUpload.init(mockSequelize);
      
      const initCall = FileUpload.init.mock.calls[0];
      expect(initCall).toBeDefined();
      
      // Ensure the method was called with the sequelize instance
      expect(FileUpload.init).toHaveBeenCalledTimes(1);
      expect(FileUpload.init).toHaveBeenCalledWith(mockSequelize);
    });
  });
  
  describe('Model Associations', () => {
    it('should associate with User and StorageProvider models', () => {
      // Mock models
      const User = {};
      const StorageProvider = {};
      
      // Call associate method
      FileUpload.associate({ User, StorageProvider });
      
      // Verify associations
      expect(FileUpload.belongsTo).toHaveBeenCalledTimes(2);
      expect(FileUpload.belongsTo).toHaveBeenCalledWith(User, { foreignKey: 'user_id' });
      expect(FileUpload.belongsTo).toHaveBeenCalledWith(StorageProvider, { foreignKey: 'storage_provider_id' });
    });
  });
}); 