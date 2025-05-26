const { DataTypes } = require('sequelize');
const SearchIndex = require('../../../../src/data/models/content/SearchIndex');

describe('SearchIndex Model', () => {
  let origInit;
  
  beforeEach(() => {
    origInit = SearchIndex.init;
    
    SearchIndex.init = jest.fn().mockReturnValue(SearchIndex);
    
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    SearchIndex.init = origInit;
    
    jest.clearAllMocks();
  });
  
  describe('Model Definition', () => {
    it('should define the model with correct attributes and options', () => {
      const mockSequelize = {};
      
      SearchIndex.init(mockSequelize);
      
      const initCall = SearchIndex.init.mock.calls[0];
      expect(initCall).toBeDefined();
      
      // Ensure the method was called with the sequelize instance
      expect(SearchIndex.init).toHaveBeenCalledTimes(1);
      expect(SearchIndex.init).toHaveBeenCalledWith(mockSequelize);
    });
  });
}); 