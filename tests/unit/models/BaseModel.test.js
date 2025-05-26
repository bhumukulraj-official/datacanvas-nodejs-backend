const { Model } = require('sequelize');
const BaseModel = require('../../../src/data/models/BaseModel');

describe('BaseModel', () => {
  let originalInit;
  let originalFindOne;
  
  beforeEach(() => {
    // Save original methods
    originalInit = Model.init;
    originalFindOne = BaseModel.findOne;
    
    // Set up mocks
    Model.init = jest.fn().mockReturnValue({});
    BaseModel.findOne = jest.fn();
    
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original methods
    Model.init = originalInit;
    BaseModel.findOne = originalFindOne;
  });

  describe('Class Definition', () => {
    it('should extend Sequelize Model class', () => {
      // Verify inheritance
      expect(BaseModel.prototype instanceof Model).toBe(true);
    });
  });

  describe('init method', () => {
    it('should call super.init with default options when not provided', () => {
      // Define minimal attributes
      const attributes = { id: { type: 'INTEGER', primaryKey: true } };
      
      // Call BaseModel.init with minimal options
      BaseModel.init(attributes, { sequelize: {} });
      
      // Verify options were set with defaults
      const optionsArg = Model.init.mock.calls[0][1];
      expect(optionsArg.timestamps).toBe(true);
      expect(optionsArg.underscored).toBe(true);
      expect(optionsArg.paranoid).toBe(true);
      expect(optionsArg.createdAt).toBe('created_at');
      expect(optionsArg.updatedAt).toBe('updated_at');
      expect(optionsArg.deletedAt).toBe('deleted_at');
    });

    it('should respect explicitly provided options', () => {
      // Define minimal attributes
      const attributes = { id: { type: 'INTEGER', primaryKey: true } };
      
      // Call BaseModel.init with explicit options
      const options = {
        sequelize: {},
        timestamps: false,
        underscored: false,
        paranoid: false,
        createdAt: 'custom_created',
        updatedAt: 'custom_updated',
        deletedAt: 'custom_deleted'
      };
      
      BaseModel.init(attributes, options);
      
      // Verify options were respected
      const optionsArg = Model.init.mock.calls[0][1];
      expect(optionsArg.timestamps).toBe(false);
      expect(optionsArg.underscored).toBe(false);
      expect(optionsArg.paranoid).toBe(false);
      expect(optionsArg.createdAt).toBeUndefined(); // Since timestamps is false
      expect(optionsArg.updatedAt).toBeUndefined(); // Since timestamps is false
      expect(optionsArg.deletedAt).toBeUndefined(); // Since paranoid and timestamps are false
    });

    it('should handle mixed options correctly', () => {
      // Define minimal attributes
      const attributes = { id: { type: 'INTEGER', primaryKey: true } };
      
      // Call BaseModel.init with mixed options
      const options = {
        sequelize: {},
        timestamps: true,
        underscored: true,
        createdAt: 'custom_created'
      };
      
      BaseModel.init(attributes, options);
      
      // Verify options were handled correctly
      const optionsArg = Model.init.mock.calls[0][1];
      expect(optionsArg.timestamps).toBe(true);
      expect(optionsArg.underscored).toBe(true);
      expect(optionsArg.paranoid).toBe(true); // Default
      expect(optionsArg.createdAt).toBe('custom_created'); // Explicit
      expect(optionsArg.updatedAt).toBe('updated_at'); // Default
      expect(optionsArg.deletedAt).toBe('deleted_at'); // Default
    });
  });

  describe('findByUuid method', () => {
    it('should call findOne with correct where clause', async () => {
      // Set up mock return value
      BaseModel.findOne.mockResolvedValue({ id: 1, uuid: 'test-uuid' });
      
      // Call findByUuid
      const result = await BaseModel.findByUuid('test-uuid');
      
      // Verify findOne was called with correct arguments
      expect(BaseModel.findOne).toHaveBeenCalledTimes(1);
      expect(BaseModel.findOne).toHaveBeenCalledWith({ 
        where: { uuid: 'test-uuid' } 
      });
      
      // Verify result
      expect(result).toEqual({ id: 1, uuid: 'test-uuid' });
    });
  });
}); 