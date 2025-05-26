const { DataTypes } = require('sequelize');
const ProjectStatus = require('../../../../src/data/models/content/ProjectStatus');

// Mock Sequelize
jest.mock('sequelize', () => {
  const mockDataTypes = {
    STRING: 'STRING',
    TEXT: 'TEXT',
    INTEGER: 'INTEGER',
    BOOLEAN: 'BOOLEAN'
  };
  
  return {
    DataTypes: mockDataTypes
  };
});

describe('ProjectStatus Model', () => {
  let origInit;
  let origHasMany;
  
  beforeEach(() => {
    origInit = ProjectStatus.init;
    origHasMany = ProjectStatus.hasMany;
    
    // Mock init
    ProjectStatus.init = jest.fn().mockReturnValue(ProjectStatus);
    
    // Mock hasMany
    ProjectStatus.hasMany = jest.fn();
    
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    ProjectStatus.init = origInit;
    ProjectStatus.hasMany = origHasMany;
    
    jest.clearAllMocks();
  });
  
  describe('Model Definition', () => {
    it('should define the model with correct attributes and options', () => {
      const mockSequelize = {};
      
      ProjectStatus.init(mockSequelize);
      
      expect(ProjectStatus.init).toHaveBeenCalledTimes(1);
      expect(ProjectStatus.init).toHaveBeenCalledWith(mockSequelize);
    });
  });
  
  describe('Model Associations', () => {
    it('should associate with Project model', () => {
      // Mock Project model
      const Project = {};
      
      // Call associate method
      ProjectStatus.associate({ Project });
      
      // Verify associations
      expect(ProjectStatus.hasMany).toHaveBeenCalledTimes(1);
      expect(ProjectStatus.hasMany).toHaveBeenCalledWith(Project, { foreignKey: 'status_code' });
    });
  });
}); 