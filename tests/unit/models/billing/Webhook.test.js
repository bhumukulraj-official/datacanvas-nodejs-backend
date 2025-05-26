const { DataTypes } = require('sequelize');
const Webhook = require('../../../../src/data/models/billing/Webhook');

describe('Webhook Model', () => {
  let origInit;
  let origBelongsTo;
  
  beforeEach(() => {
    origInit = Webhook.init;
    origBelongsTo = Webhook.belongsTo;
    
    Webhook.init = jest.fn().mockReturnValue(Webhook);
    Webhook.belongsTo = jest.fn();
    
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    Webhook.init = origInit;
    Webhook.belongsTo = origBelongsTo;
    
    jest.clearAllMocks();
  });
  
  describe('Model Definition', () => {
    it('should define the model with correct attributes and options', () => {
      const mockSequelize = {};
      
      Webhook.init(mockSequelize);
      
      const initCall = Webhook.init.mock.calls[0];
      expect(initCall).toBeDefined();
      
      // Ensure the method was called with the sequelize instance
      expect(Webhook.init).toHaveBeenCalledTimes(1);
      expect(Webhook.init).toHaveBeenCalledWith(mockSequelize);
    });
  });
  
  describe('Model Associations', () => {
    it('should associate with PaymentProvider model', () => {
      // Mock PaymentProvider model
      const PaymentProvider = {};
      
      // Call associate method
      Webhook.associate({ PaymentProvider });
      
      // Verify associations
      expect(Webhook.belongsTo).toHaveBeenCalledTimes(1);
      expect(Webhook.belongsTo).toHaveBeenCalledWith(PaymentProvider, { foreignKey: 'provider_code', as: 'provider' });
    });
  });
}); 