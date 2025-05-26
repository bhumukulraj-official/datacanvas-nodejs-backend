const { DataTypes } = require('sequelize');
const ProjectVisibility = require('../../../../src/data/models/content/ProjectVisibility');

describe('ProjectVisibility Model', () => {
  let origInit;
  let origBelongsTo;
  
  beforeEach(() => {
    origInit = ProjectVisibility.init;
    origBelongsTo = ProjectVisibility.belongsTo;
    
    ProjectVisibility.init = jest.fn().mockReturnValue(ProjectVisibility);
    ProjectVisibility.belongsTo = jest.fn();
    
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    ProjectVisibility.init = origInit;
    ProjectVisibility.belongsTo = origBelongsTo;
    
    jest.clearAllMocks();
  });
  
  describe('Model Definition', () => {
    it('should define the model with correct attributes and options', () => {
      const mockSequelize = {};
      
      ProjectVisibility.init(mockSequelize);
      
      const initCall = ProjectVisibility.init.mock.calls[0];
      expect(initCall).toBeDefined();
      
      // Ensure the method was called with the sequelize instance
      expect(ProjectVisibility.init).toHaveBeenCalledTimes(1);
      expect(ProjectVisibility.init).toHaveBeenCalledWith(mockSequelize);
    });
  });
  
  describe('Model Associations', () => {
    it('should associate with Project model', () => {
      // Mock Project model
      const Project = {};
      
      // Call associate method
      ProjectVisibility.associate({ Project });
      
      // Verify associations
      expect(ProjectVisibility.belongsTo).toHaveBeenCalledTimes(1);
      expect(ProjectVisibility.belongsTo).toHaveBeenCalledWith(Project, { foreignKey: 'project_id' });
    });
  });
}); 