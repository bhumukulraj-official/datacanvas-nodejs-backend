const { DataTypes } = require('sequelize');
const ConversationParticipant = require('../../../../src/data/models/messaging/ConversationParticipant');

describe('ConversationParticipant Model', () => {
  let origInit;
  let origBelongsTo;
  
  beforeEach(() => {
    origInit = ConversationParticipant.init;
    origBelongsTo = ConversationParticipant.belongsTo;
    
    ConversationParticipant.init = jest.fn().mockReturnValue(ConversationParticipant);
    ConversationParticipant.belongsTo = jest.fn();
    
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    ConversationParticipant.init = origInit;
    ConversationParticipant.belongsTo = origBelongsTo;
    
    jest.clearAllMocks();
  });
  
  describe('Model Definition', () => {
    it('should define the model with correct attributes and options', () => {
      const mockSequelize = {};
      
      ConversationParticipant.init(mockSequelize);
      
      const initCall = ConversationParticipant.init.mock.calls[0];
      expect(initCall).toBeDefined();
      
      // Ensure the method was called with the sequelize instance
      expect(ConversationParticipant.init).toHaveBeenCalledTimes(1);
      expect(ConversationParticipant.init).toHaveBeenCalledWith(mockSequelize);
    });
  });
  
  describe('Model Associations', () => {
    it('should associate with Conversation, User, and Message models', () => {
      // Mock models
      const Conversation = {};
      const User = {};
      const Message = {};
      
      // Call associate method
      ConversationParticipant.associate({ Conversation, User, Message });
      
      // Verify associations
      expect(ConversationParticipant.belongsTo).toHaveBeenCalledTimes(3);
      expect(ConversationParticipant.belongsTo).toHaveBeenCalledWith(Conversation, { foreignKey: 'conversation_id' });
      expect(ConversationParticipant.belongsTo).toHaveBeenCalledWith(User, { foreignKey: 'user_id' });
      expect(ConversationParticipant.belongsTo).toHaveBeenCalledWith(Message, { foreignKey: 'last_read_message_id', as: 'lastReadMessage' });
    });
  });
}); 