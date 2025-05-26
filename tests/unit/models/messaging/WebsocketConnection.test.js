const { DataTypes } = require('sequelize');
const WebsocketConnection = require('../../../../src/data/models/messaging/WebsocketConnection');

describe('WebsocketConnection Model', () => {
  let origInit;
  let origBelongsTo;
  let origHasMany;
  
  beforeEach(() => {
    origInit = WebsocketConnection.init;
    origBelongsTo = WebsocketConnection.belongsTo;
    origHasMany = WebsocketConnection.hasMany;
    
    WebsocketConnection.init = jest.fn().mockReturnValue(WebsocketConnection);
    WebsocketConnection.belongsTo = jest.fn();
    WebsocketConnection.hasMany = jest.fn();
    
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    WebsocketConnection.init = origInit;
    WebsocketConnection.belongsTo = origBelongsTo;
    WebsocketConnection.hasMany = origHasMany;
    
    jest.clearAllMocks();
  });
  
  describe('Model Definition', () => {
    it('should define the model with correct attributes and options', () => {
      const mockSequelize = {};
      
      WebsocketConnection.init(mockSequelize);
      
      const initCall = WebsocketConnection.init.mock.calls[0];
      expect(initCall).toBeDefined();
      
      // Ensure the method was called with the sequelize instance
      expect(WebsocketConnection.init).toHaveBeenCalledTimes(1);
      expect(WebsocketConnection.init).toHaveBeenCalledWith(mockSequelize);
    });
  });
  
  describe('Model Associations', () => {
    it('should associate with User and WebsocketMessage models', () => {
      // Mock models
      const User = {};
      const WebsocketMessage = {};
      
      // Call associate method
      WebsocketConnection.associate({ User, WebsocketMessage });
      
      // Verify associations
      expect(WebsocketConnection.belongsTo).toHaveBeenCalledTimes(1);
      expect(WebsocketConnection.belongsTo).toHaveBeenCalledWith(User, { foreignKey: 'user_id' });
      
      expect(WebsocketConnection.hasMany).toHaveBeenCalledTimes(1);
      expect(WebsocketConnection.hasMany).toHaveBeenCalledWith(WebsocketMessage, { 
        foreignKey: 'connection_id', 
        sourceKey: 'connection_id' 
      });
    });
  });
}); 