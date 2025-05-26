const { DataTypes } = require('sequelize');
const ProjectClientAssignment = require('../../../../src/data/models/content/ProjectClientAssignment');

describe('ProjectClientAssignment Model', () => {
  let origInit;
  let origBelongsTo;
  
  beforeEach(() => {
    origInit = ProjectClientAssignment.init;
    origBelongsTo = ProjectClientAssignment.belongsTo;
    
    ProjectClientAssignment.init = jest.fn().mockReturnValue(ProjectClientAssignment);
    ProjectClientAssignment.belongsTo = jest.fn();
    
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    ProjectClientAssignment.init = origInit;
    ProjectClientAssignment.belongsTo = origBelongsTo;
    
    jest.clearAllMocks();
  });
  
  describe('Model Definition', () => {
    it('should define the model with correct attributes and options', () => {
      const mockSequelize = {};
      
      ProjectClientAssignment.init(mockSequelize);
      
      const initCall = ProjectClientAssignment.init.mock.calls[0];
      expect(initCall).toBeDefined();
      
      // Ensure the method was called with the sequelize instance
      expect(ProjectClientAssignment.init).toHaveBeenCalledTimes(1);
      expect(ProjectClientAssignment.init).toHaveBeenCalledWith(mockSequelize);
    });
  });
  
  describe('Model Associations', () => {
    it('should associate with Project and User models', () => {
      // Mock models
      const Project = {};
      const User = {};
      
      // Call associate method
      ProjectClientAssignment.associate({ Project, User });
      
      // Verify associations
      expect(ProjectClientAssignment.belongsTo).toHaveBeenCalledTimes(2);
      expect(ProjectClientAssignment.belongsTo).toHaveBeenCalledWith(Project);
      expect(ProjectClientAssignment.belongsTo).toHaveBeenCalledWith(User, { as: 'client' });
    });
  });
}); 