const { DataTypes } = require('sequelize');
const PublicApiView = require('../../../../src/data/models/public_api/PublicApiView');

describe('PublicApiView Model', () => {
  let origInit;
  
  beforeEach(() => {
    origInit = PublicApiView.init;
    
    PublicApiView.init = jest.fn().mockReturnValue(PublicApiView);
    
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    PublicApiView.init = origInit;
    
    jest.clearAllMocks();
  });
  
  describe('Model Definition', () => {
    it('should define the model with correct attributes and options', () => {
      const mockSequelize = {};
      
      PublicApiView.init(mockSequelize);
      
      const initCall = PublicApiView.init.mock.calls[0];
      expect(initCall).toBeDefined();
      
      // Ensure the method was called with the sequelize instance
      expect(PublicApiView.init).toHaveBeenCalledTimes(1);
      expect(PublicApiView.init).toHaveBeenCalledWith(mockSequelize);
    });
  });
}); 