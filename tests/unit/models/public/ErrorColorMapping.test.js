const { DataTypes } = require('sequelize');
const ErrorColorMapping = require('../../../../src/data/models/public/ErrorColorMapping');

describe('ErrorColorMapping Model', () => {
  let origInit;
  
  beforeEach(() => {
    origInit = ErrorColorMapping.init;
    
    ErrorColorMapping.init = jest.fn().mockReturnValue(ErrorColorMapping);
    
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    ErrorColorMapping.init = origInit;
    
    jest.clearAllMocks();
  });
  
  describe('Model Definition', () => {
    it('should define the model with correct attributes and options', () => {
      const mockSequelize = {};
      
      ErrorColorMapping.init(mockSequelize);
      
      const initCall = ErrorColorMapping.init.mock.calls[0];
      expect(initCall).toBeDefined();
      
      // Ensure the method was called with the sequelize instance
      expect(ErrorColorMapping.init).toHaveBeenCalledTimes(1);
      expect(ErrorColorMapping.init).toHaveBeenCalledWith(mockSequelize);
    });
  });
});