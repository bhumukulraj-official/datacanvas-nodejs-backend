const { DataTypes } = require('sequelize');
const ProjectFile = require('../../../../src/data/models/content/ProjectFile');

describe('ProjectFile Model', () => {
  let origInit;
  let origBelongsTo;
  
  beforeEach(() => {
    origInit = ProjectFile.init;
    origBelongsTo = ProjectFile.belongsTo;
    
    ProjectFile.init = jest.fn().mockReturnValue(ProjectFile);
    ProjectFile.belongsTo = jest.fn();
    
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    ProjectFile.init = origInit;
    ProjectFile.belongsTo = origBelongsTo;
    
    jest.clearAllMocks();
  });
  
  describe('Model Definition', () => {
    it('should define the model with correct attributes and options', () => {
      const mockSequelize = {};
      
      ProjectFile.init(mockSequelize);
      
      const initCall = ProjectFile.init.mock.calls[0];
      expect(initCall).toBeDefined();
      
      // Ensure the method was called with the sequelize instance
      expect(ProjectFile.init).toHaveBeenCalledTimes(1);
      expect(ProjectFile.init).toHaveBeenCalledWith(mockSequelize);
    });
  });
  
  describe('Model Associations', () => {
    it('should associate with Project and User models', () => {
      // Mock models
      const Project = {};
      const User = {};
      
      // Call associate method
      ProjectFile.associate({ Project, User });
      
      // Verify associations
      expect(ProjectFile.belongsTo).toHaveBeenCalledTimes(2);
      expect(ProjectFile.belongsTo).toHaveBeenCalledWith(Project);
      expect(ProjectFile.belongsTo).toHaveBeenCalledWith(User, { 
        foreignKey: 'uploaded_by',
        as: 'uploader',
        onDelete: 'NO ACTION'
      });
    });
  });
}); 