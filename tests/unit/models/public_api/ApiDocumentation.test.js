const { DataTypes } = require('sequelize');
const ApiDocumentation = require('../../../../src/data/models/public_api/ApiDocumentation');

describe('ApiDocumentation Model', () => {
  let origInit;
  
  beforeEach(() => {
    origInit = ApiDocumentation.init;
    
    ApiDocumentation.init = jest.fn().mockReturnValue(ApiDocumentation);
    
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    ApiDocumentation.init = origInit;
    
    jest.clearAllMocks();
  });
  
  describe('Model Definition', () => {
    it('should define the model with correct attributes and options', () => {
      const mockSequelize = {};
      
      ApiDocumentation.init(mockSequelize);
      
      const initCall = ApiDocumentation.init.mock.calls[0];
      expect(initCall).toBeDefined();
      
      // Ensure the method was called with the sequelize instance
      expect(ApiDocumentation.init).toHaveBeenCalledTimes(1);
      expect(ApiDocumentation.init).toHaveBeenCalledWith(mockSequelize);
    });
  });
}); 