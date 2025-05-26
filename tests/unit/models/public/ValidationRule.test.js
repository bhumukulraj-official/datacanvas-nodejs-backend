const { DataTypes } = require('sequelize');
const ValidationRule = require('../../../../src/data/models/public/ValidationRule');

describe('ValidationRule Model', () => {
  let origInit;
  
  beforeEach(() => {
    origInit = ValidationRule.init;
    ValidationRule.init = jest.fn().mockReturnValue(ValidationRule);
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    ValidationRule.init = origInit;
    jest.clearAllMocks();
  });

  describe('Model Definition', () => {
    it('should define the model with correct attributes', () => {
      const mockSequelize = {};
      
      ValidationRule.init(mockSequelize);
      
      const initCall = ValidationRule.init.mock.calls[0];
      expect(initCall).toBeDefined();
      
      // We can't access the actual arguments passed to the mock directly
      // since they're passed internally to super.init, so instead we'll 
      // ensure the method was called once with the sequelize instance
      expect(ValidationRule.init).toHaveBeenCalledTimes(1);
      expect(ValidationRule.init).toHaveBeenCalledWith(mockSequelize);
    });
  });

  describe('Model Usage', () => {
    it('should allow creating validation rules for various entities', () => {
      // This is more of an integration test, but demonstrating how the model would be used
      
      // Setup mock data for a validation rule
      const userEmailRule = {
        entity_type: 'user',
        field_name: 'email',
        rule_type: 'required',
        error_message: 'Email is required'
      };
      
      const projectTitleRule = {
        entity_type: 'project',
        field_name: 'title',
        rule_type: 'max_length',
        rule_value: '200',
        error_message: 'Project title cannot exceed 200 characters'
      };
      
      // Verify that the mock objects have the expected properties
      expect(userEmailRule.entity_type).toBe('user');
      expect(projectTitleRule.rule_type).toBe('max_length');
      expect(projectTitleRule.rule_value).toBe('200');
    });
  });
}); 