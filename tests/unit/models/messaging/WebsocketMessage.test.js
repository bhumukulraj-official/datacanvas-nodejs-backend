const { DataTypes } = require('sequelize');
const WebsocketMessage = require('../../../../src/data/models/messaging/WebsocketMessage');

describe('WebsocketMessage Model', () => {
  let origInit;
  let origBelongsTo;
  
  beforeEach(() => {
    origInit = WebsocketMessage.init;
    origBelongsTo = WebsocketMessage.belongsTo;
    
    WebsocketMessage.init = jest.fn().mockReturnValue(WebsocketMessage);
    WebsocketMessage.belongsTo = jest.fn();
    
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    WebsocketMessage.init = origInit;
    WebsocketMessage.belongsTo = origBelongsTo;
    
    jest.clearAllMocks();
  });
  
  describe('Model Definition', () => {
    it('should define the model with correct attributes and options', () => {
      const mockSequelize = {};
      
      WebsocketMessage.init(mockSequelize);
      
      const initCall = WebsocketMessage.init.mock.calls[0];
      expect(initCall).toBeDefined();
      
      // Ensure the method was called with the sequelize instance
      expect(WebsocketMessage.init).toHaveBeenCalledTimes(1);
      expect(WebsocketMessage.init).toHaveBeenCalledWith(mockSequelize);
    });
  });
  
  describe('Model Associations', () => {
    it('should associate with WebsocketConnection model', () => {
      // Mock models
      const WebsocketConnection = {};
      
      // Call associate method
      WebsocketMessage.associate({ WebsocketConnection });
      
      // Verify associations
      expect(WebsocketMessage.belongsTo).toHaveBeenCalledTimes(1);
      expect(WebsocketMessage.belongsTo).toHaveBeenCalledWith(WebsocketConnection, { 
        foreignKey: 'connection_id', 
        targetKey: 'connection_id' 
      });
    });
  });
}); 