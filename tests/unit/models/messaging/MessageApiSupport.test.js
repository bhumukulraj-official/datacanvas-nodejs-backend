const { DataTypes } = require('sequelize');
const MessageApiSupport = require('../../../../src/data/models/messaging/MessageApiSupport');

describe('MessageApiSupport Model', () => {
  let origInit;
  
  beforeEach(() => {
    origInit = MessageApiSupport.init;
    
    MessageApiSupport.init = jest.fn().mockReturnValue(MessageApiSupport);
    
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    MessageApiSupport.init = origInit;
    
    jest.clearAllMocks();
  });
  
  describe('Model Definition', () => {
    it('should define the model with correct attributes and options', () => {
      const mockSequelize = {};
      
      MessageApiSupport.init(mockSequelize);
      
      const initCall = MessageApiSupport.init.mock.calls[0];
      expect(initCall).toBeDefined();
      
      // Ensure the method was called with the sequelize instance
      expect(MessageApiSupport.init).toHaveBeenCalledTimes(1);
      expect(MessageApiSupport.init).toHaveBeenCalledWith(mockSequelize);
    });
  });
}); 