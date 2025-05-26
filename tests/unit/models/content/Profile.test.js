const { DataTypes } = require('sequelize');
const Profile = require('../../../../src/data/models/content/Profile');

describe('Profile Model', () => {
  let sequelize;
  
  beforeEach(() => {
    // Mock sequelize
    sequelize = {
      define: jest.fn().mockReturnThis()
    };
    
    // Mock the init method
    jest.spyOn(Profile, 'init');
    
    // Mock the associate method
    jest.spyOn(Profile, 'belongsTo');
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Model Definition', () => {
    it('should define the model with correct attributes and options', () => {
      // Initialize the model
      Profile.init(sequelize);
      
      // Verify init was called
      expect(Profile.init).toHaveBeenCalled();
      
      // Verify correct table name and schema
      const options = Profile.init.mock.calls[0][1];
      expect(options.tableName).toBe('profiles');
      expect(options.schema).toBe('content');
      
      // Verify paranoid mode
      expect(options.paranoid).toBe(true);
      
      // Verify indexes
      expect(options.indexes).toEqual(expect.arrayContaining([
        { fields: ['user_id'] },
        { fields: ['is_deleted'] },
        { 
          name: 'idx_profiles_social_links',
          fields: ['social_links'],
          using: 'gin'
        }
      ]));
      
      // Verify attributes
      const attributes = Profile.init.mock.calls[0][0];
      expect(attributes.user_id.allowNull).toBe(false);
      expect(attributes.user_id.unique).toBe(true);
      expect(attributes.social_links).toBeDefined();
      expect(attributes.metadata).toBeDefined();
    });
  });
  
  describe('Model Associations', () => {
    it('should associate with User model', () => {
      // Mock User model
      const User = {};
      
      // Call associate method
      Profile.associate({ User });
      
      // Verify associations
      expect(Profile.belongsTo).toHaveBeenCalledTimes(1);
      expect(Profile.belongsTo).toHaveBeenCalledWith(User, { foreignKey: 'user_id', unique: true });
    });
  });
}); 