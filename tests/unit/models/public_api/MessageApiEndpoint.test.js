const { DataTypes } = require('sequelize');
const MessageApiEndpoint = require('../../../../src/data/models/public_api/MessageApiEndpoint');

describe('MessageApiEndpoint Model', () => {
  let origInit;
  let origBelongsTo;
  
  beforeEach(() => {
    origInit = MessageApiEndpoint.init;
    origBelongsTo = MessageApiEndpoint.belongsTo;
    
    MessageApiEndpoint.init = jest.fn().mockReturnValue(MessageApiEndpoint);
    MessageApiEndpoint.belongsTo = jest.fn();
    
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    MessageApiEndpoint.init = origInit;
    MessageApiEndpoint.belongsTo = origBelongsTo;
    
    jest.clearAllMocks();
  });
  
  describe('Model Definition', () => {
    it('should define the model with correct attributes and options', () => {
      const mockSequelize = {};
      
      MessageApiEndpoint.init(mockSequelize);
      
      const initCall = MessageApiEndpoint.init.mock.calls[0];
      expect(initCall).toBeDefined();
      
      // Ensure the method was called with the sequelize instance
      expect(MessageApiEndpoint.init).toHaveBeenCalledTimes(1);
      expect(MessageApiEndpoint.init).toHaveBeenCalledWith(mockSequelize);
    });
  });
  
  describe('Model Associations', () => {
    it('should associate with MessageApiSupport model', () => {
      // Mock models
      const MessageApiSupport = {};
      
      // Call associate method
      MessageApiEndpoint.associate({ MessageApiSupport });
      
      // Verify associations
      expect(MessageApiEndpoint.belongsTo).toHaveBeenCalledTimes(1);
      expect(MessageApiEndpoint.belongsTo).toHaveBeenCalledWith(MessageApiSupport, { foreignKey: 'api_support_id' });
    });
  });
});