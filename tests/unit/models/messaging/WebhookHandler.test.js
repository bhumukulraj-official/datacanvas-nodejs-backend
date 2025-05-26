const { DataTypes } = require('sequelize');
const WebhookHandler = require('../../../../src/data/models/messaging/WebhookHandler');

describe('WebhookHandler Model', () => {
  let origInit;
  let origBelongsTo;
  
  beforeEach(() => {
    origInit = WebhookHandler.init;
    origBelongsTo = WebhookHandler.belongsTo;
    
    WebhookHandler.init = jest.fn().mockReturnValue(WebhookHandler);
    WebhookHandler.belongsTo = jest.fn();
    
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    WebhookHandler.init = origInit;
    WebhookHandler.belongsTo = origBelongsTo;
    
    jest.clearAllMocks();
  });
  
  describe('Model Definition', () => {
    it('should define the model with correct attributes and options', () => {
      const mockSequelize = {};
      
      WebhookHandler.init(mockSequelize);
      
      const initCall = WebhookHandler.init.mock.calls[0];
      expect(initCall).toBeDefined();
      
      // Ensure the method was called with the sequelize instance
      expect(WebhookHandler.init).toHaveBeenCalledTimes(1);
      expect(WebhookHandler.init).toHaveBeenCalledWith(mockSequelize);
    });
  });
  
  describe('Model Associations', () => {
    it('should associate with Webhook model', () => {
      // Mock Webhook model
      const Webhook = {};
      
      // Call associate method
      WebhookHandler.associate({ Webhook });
      
      // Verify associations
      expect(WebhookHandler.belongsTo).toHaveBeenCalledTimes(1);
      expect(WebhookHandler.belongsTo).toHaveBeenCalledWith(Webhook, { foreignKey: 'webhook_id' });
    });
  });
}); 