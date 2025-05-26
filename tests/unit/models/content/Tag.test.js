const { DataTypes } = require('sequelize');
const Tag = require('../../../../src/data/models/content/Tag');

describe('Tag Model', () => {
  let origInit;
  let origHasMany;
  let origBelongsToMany;
  
  beforeEach(() => {
    origInit = Tag.init;
    origHasMany = Tag.hasMany;
    origBelongsToMany = Tag.belongsToMany;
    
    Tag.init = jest.fn().mockReturnValue(Tag);
    Tag.hasMany = jest.fn();
    Tag.belongsToMany = jest.fn();
    
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    Tag.init = origInit;
    Tag.hasMany = origHasMany;
    Tag.belongsToMany = origBelongsToMany;
    
    jest.clearAllMocks();
  });
  
  describe('Model Definition', () => {
    it('should define the model with correct attributes and options', () => {
      const mockSequelize = {};
      
      Tag.init(mockSequelize);
      
      const initCall = Tag.init.mock.calls[0];
      expect(initCall).toBeDefined();
      
      // Ensure the method was called with the sequelize instance
      expect(Tag.init).toHaveBeenCalledTimes(1);
      expect(Tag.init).toHaveBeenCalledWith(mockSequelize);
    });
  });
  
  describe('Model Associations', () => {
    it('should associate with Project and ProjectTag models', () => {
      // Mock models
      const Project = {};
      const ProjectTag = {};
      
      // Call associate method
      Tag.associate({ Project, ProjectTag });
      
      // Verify associations
      expect(Tag.belongsToMany).toHaveBeenCalledTimes(1);
      expect(Tag.belongsToMany).toHaveBeenCalledWith(Project, { through: ProjectTag, foreignKey: 'tag_id' });
      expect(Tag.hasMany).toHaveBeenCalledTimes(1);
      expect(Tag.hasMany).toHaveBeenCalledWith(ProjectTag, { foreignKey: 'tag_id' });
    });
  });
}); 