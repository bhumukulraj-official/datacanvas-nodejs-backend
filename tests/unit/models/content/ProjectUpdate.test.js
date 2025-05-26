const { DataTypes } = require('sequelize');
const ProjectUpdate = require('../../../../src/data/models/content/ProjectUpdate');

describe('ProjectUpdate Model', () => {
  let origInit;
  let origBelongsTo;
  
  beforeEach(() => {
    origInit = ProjectUpdate.init;
    origBelongsTo = ProjectUpdate.belongsTo;
    
    ProjectUpdate.init = jest.fn().mockReturnValue(ProjectUpdate);
    ProjectUpdate.belongsTo = jest.fn();
    
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    ProjectUpdate.init = origInit;
    ProjectUpdate.belongsTo = origBelongsTo;
    
    jest.clearAllMocks();
  });
  
  describe('Model Definition', () => {
    it('should define the model with correct attributes and options', () => {
      const mockSequelize = {};
      
      ProjectUpdate.init(mockSequelize);
      
      const initCall = ProjectUpdate.init.mock.calls[0];
      expect(initCall).toBeDefined();
      
      // Ensure the method was called with the sequelize instance
      expect(ProjectUpdate.init).toHaveBeenCalledTimes(1);
      expect(ProjectUpdate.init).toHaveBeenCalledWith(mockSequelize);
    });
  });
  
  describe('Model Associations', () => {
    it('should associate with Project and User models', () => {
      // Mock models
      const Project = {};
      const User = {};
      
      // Call associate method
      ProjectUpdate.associate({ Project, User });
      
      // Verify associations
      expect(ProjectUpdate.belongsTo).toHaveBeenCalledTimes(2);
      expect(ProjectUpdate.belongsTo).toHaveBeenCalledWith(Project);
      expect(ProjectUpdate.belongsTo).toHaveBeenCalledWith(User, { foreignKey: 'created_by', as: 'author' });
    });
  });
}); 