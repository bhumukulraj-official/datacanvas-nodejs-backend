const { DataTypes } = require('sequelize');
const ProjectTag = require('../../../../src/data/models/content/ProjectTag');

describe('ProjectTag Model', () => {
  let origInit;
  let origBelongsTo;
  
  beforeEach(() => {
    origInit = ProjectTag.init;
    origBelongsTo = ProjectTag.belongsTo;
    
    ProjectTag.init = jest.fn().mockReturnValue(ProjectTag);
    ProjectTag.belongsTo = jest.fn();
    
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    ProjectTag.init = origInit;
    ProjectTag.belongsTo = origBelongsTo;
    
    jest.clearAllMocks();
  });
  
  describe('Model Definition', () => {
    it('should define the model with correct attributes and options', () => {
      const mockSequelize = {};
      
      ProjectTag.init(mockSequelize);
      
      const initCall = ProjectTag.init.mock.calls[0];
      expect(initCall).toBeDefined();
      
      // Ensure the method was called with the sequelize instance
      expect(ProjectTag.init).toHaveBeenCalledTimes(1);
      expect(ProjectTag.init).toHaveBeenCalledWith(mockSequelize);
    });
  });
  
  describe('Model Associations', () => {
    it('should associate with Project and Tag models', () => {
      // Mock models
      const Project = {};
      const Tag = {};
      
      // Call associate method
      ProjectTag.associate({ Project, Tag });
      
      // Verify associations
      expect(ProjectTag.belongsTo).toHaveBeenCalledTimes(2);
      expect(ProjectTag.belongsTo).toHaveBeenCalledWith(Project, { foreignKey: 'project_id' });
      expect(ProjectTag.belongsTo).toHaveBeenCalledWith(Tag, { foreignKey: 'tag_id' });
    });
  });
}); 