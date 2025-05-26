const { DataTypes } = require('sequelize');
const Conversation = require('../../../../src/data/models/messaging/Conversation');

describe('Conversation Model', () => {
  let origInit;
  let origHasMany;
  let origBelongsToMany;
  let origBelongsTo;
  
  beforeEach(() => {
    origInit = Conversation.init;
    origHasMany = Conversation.hasMany;
    origBelongsToMany = Conversation.belongsToMany;
    origBelongsTo = Conversation.belongsTo;
    
    Conversation.init = jest.fn().mockReturnValue(Conversation);
    Conversation.hasMany = jest.fn();
    Conversation.belongsToMany = jest.fn();
    Conversation.belongsTo = jest.fn();
    
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    Conversation.init = origInit;
    Conversation.hasMany = origHasMany;
    Conversation.belongsToMany = origBelongsToMany;
    Conversation.belongsTo = origBelongsTo;
    
    jest.clearAllMocks();
  });
  
  describe('Model Definition', () => {
    it('should define the model with correct attributes and options', () => {
      const mockSequelize = {};
      
      Conversation.init(mockSequelize);
      
      const initCall = Conversation.init.mock.calls[0];
      expect(initCall).toBeDefined();
      
      // Ensure the method was called with the sequelize instance
      expect(Conversation.init).toHaveBeenCalledTimes(1);
      expect(Conversation.init).toHaveBeenCalledWith(mockSequelize);
    });
  });
  
  describe('Model Associations', () => {
    it('should associate with Message, ConversationParticipant, and User models', () => {
      // Mock models that extend Sequelize.Model
      const Message = function() {};
      Message.prototype = { MODEL: true };
      Message.associations = {};
      
      const ConversationParticipant = function() {};
      ConversationParticipant.prototype = { MODEL: true };
      ConversationParticipant.associations = {};
      
      const User = function() {};
      User.prototype = { MODEL: true };
      User.associations = {};
      
      // Call associate method
      Conversation.associate({ Message, ConversationParticipant, User });
      
      // Verify associations
      expect(Conversation.belongsTo).toHaveBeenCalledTimes(1);
      expect(Conversation.belongsTo).toHaveBeenCalledWith(Message, { as: 'lastMessage', foreignKey: 'last_message_id' });
      
      expect(Conversation.hasMany).toHaveBeenCalledTimes(2);
      expect(Conversation.hasMany).toHaveBeenCalledWith(Message, { 
        foreignKey: 'conversation_id',
        onDelete: 'CASCADE'
      });
      expect(Conversation.hasMany).toHaveBeenCalledWith(ConversationParticipant, { foreignKey: 'conversation_id' });
      
      expect(Conversation.belongsToMany).toHaveBeenCalledTimes(1);
      expect(Conversation.belongsToMany).toHaveBeenCalledWith(User, { 
        through: ConversationParticipant,
        foreignKey: 'conversation_id',
        otherKey: 'user_id' 
      });
    });
  });
}); 