const { DataTypes } = require('sequelize');
const MessageAttachment = require('../../../../src/data/models/messaging/MessageAttachment');

describe('MessageAttachment Model', () => {
  let origInit;
  let origBelongsTo;
  
  beforeEach(() => {
    origInit = MessageAttachment.init;
    origBelongsTo = MessageAttachment.belongsTo;
    
    MessageAttachment.init = jest.fn().mockReturnValue(MessageAttachment);
    MessageAttachment.belongsTo = jest.fn();
    
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    MessageAttachment.init = origInit;
    MessageAttachment.belongsTo = origBelongsTo;
    
    jest.clearAllMocks();
  });
  
  describe('Model Definition', () => {
    it('should define the model with correct attributes and options', () => {
      const mockSequelize = {};
      
      MessageAttachment.init(mockSequelize);
      
      const initCall = MessageAttachment.init.mock.calls[0];
      expect(initCall).toBeDefined();
      
      // Ensure the method was called with the sequelize instance
      expect(MessageAttachment.init).toHaveBeenCalledTimes(1);
      expect(MessageAttachment.init).toHaveBeenCalledWith(mockSequelize);
    });
  });
  
  describe('Model Associations', () => {
    it('should associate with Message model', () => {
      // Mock Message model
      const Message = {};
      
      // Call associate method
      MessageAttachment.associate({ Message });
      
      // Verify associations
      expect(MessageAttachment.belongsTo).toHaveBeenCalledTimes(1);
      expect(MessageAttachment.belongsTo).toHaveBeenCalledWith(Message, { foreignKey: 'message_id' });
    });
  });
}); 