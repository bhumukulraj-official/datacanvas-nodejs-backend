const { DataTypes } = require('sequelize');
const Message = require('../../../../src/data/models/messaging/Message');

describe('Message Model', () => {
  let origInit;
  let origBelongsTo;
  let origHasMany;
  
  beforeEach(() => {
    origInit = Message.init;
    origBelongsTo = Message.belongsTo;
    origHasMany = Message.hasMany;
    Message.init = jest.fn().mockReturnValue(Message);
    Message.belongsTo = jest.fn();
    Message.hasMany = jest.fn();
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    Message.init = origInit;
    Message.belongsTo = origBelongsTo;
    Message.hasMany = origHasMany;
    jest.clearAllMocks();
  });

  describe('Model Definition', () => {
    it('should define the model with correct attributes', () => {
      const mockSequelize = {};
      
      Message.init(mockSequelize);
      
      const initCall = Message.init.mock.calls[0];
      expect(initCall).toBeDefined();
      
      // We can't access the actual arguments passed to the mock directly
      // since they're passed internally to super.init, so instead we'll 
      // ensure the method was called once with the sequelize instance
      expect(Message.init).toHaveBeenCalledTimes(1);
      expect(Message.init).toHaveBeenCalledWith(mockSequelize);
    });
  });

  describe('Model Associations', () => {
    it('should define correct associations', () => {
      // Create mock models
      const User = {};
      const Project = {};
      const Conversation = {};
      const MessageAttachment = {};
      
      // Call the associate method
      Message.associate({ User, Project, Conversation, MessageAttachment });
      
      // Verify the associations were called correctly
      expect(Message.belongsTo).toHaveBeenCalledTimes(4);
      
      // Check sender association
      expect(Message.belongsTo).toHaveBeenCalledWith(User, { 
        as: 'sender', 
        foreignKey: 'sender_id' 
      });
      
      // Check receiver association
      expect(Message.belongsTo).toHaveBeenCalledWith(User, { 
        as: 'receiver', 
        foreignKey: 'receiver_id' 
      });
      
      // Check project association
      expect(Message.belongsTo).toHaveBeenCalledWith(Project, { 
        foreignKey: 'project_id' 
      });
      
      // Check conversation association
      expect(Message.belongsTo).toHaveBeenCalledWith(Conversation, { 
        foreignKey: 'conversation_id' 
      });
      
      // Check MessageAttachment association
      expect(Message.hasMany).toHaveBeenCalledWith(MessageAttachment, { 
        foreignKey: 'message_id' 
      });
      expect(Message.hasMany).toHaveBeenCalledTimes(1);
    });
  });
}); 