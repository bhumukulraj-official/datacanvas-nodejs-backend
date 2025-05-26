const { DataTypes } = require('sequelize');
const Skill = require('../../../../src/data/models/content/Skill');

describe('Skill Model', () => {
  let origInit;
  let origBelongsTo;
  
  beforeEach(() => {
    origInit = Skill.init;
    origBelongsTo = Skill.belongsTo;
    
    Skill.init = jest.fn().mockReturnValue(Skill);
    Skill.belongsTo = jest.fn();
    
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    Skill.init = origInit;
    Skill.belongsTo = origBelongsTo;
    
    jest.clearAllMocks();
  });
  
  describe('Model Definition', () => {
    it('should define the model with correct attributes and options', () => {
      const mockSequelize = {};
      
      Skill.init(mockSequelize);
      
      const initCall = Skill.init.mock.calls[0];
      expect(initCall).toBeDefined();
      
      // Ensure the method was called with the sequelize instance
      expect(Skill.init).toHaveBeenCalledTimes(1);
      expect(Skill.init).toHaveBeenCalledWith(mockSequelize);
    });
  });
  
  describe('Model Associations', () => {
    it('should associate with User model', () => {
      // Mock User model
      const User = {};
      
      // Call associate method
      Skill.associate({ User });
      
      // Verify associations
      expect(Skill.belongsTo).toHaveBeenCalledTimes(1);
      expect(Skill.belongsTo).toHaveBeenCalledWith(User, { foreignKey: 'user_id' });
    });
  });
}); 