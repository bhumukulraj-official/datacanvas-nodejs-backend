const { DataTypes } = require('sequelize');
const ClientInvitation = require('../../../../src/data/models/auth/ClientInvitation');

describe('ClientInvitation Model', () => {
  let origInit;
  let origBelongsTo;
  
  beforeEach(() => {
    origInit = ClientInvitation.init;
    origBelongsTo = ClientInvitation.belongsTo;
    
    ClientInvitation.init = jest.fn().mockReturnValue(ClientInvitation);
    ClientInvitation.belongsTo = jest.fn();
    
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    ClientInvitation.init = origInit;
    ClientInvitation.belongsTo = origBelongsTo;
    
    jest.clearAllMocks();
  });
  
  describe('Model Definition', () => {
    it('should define the model with correct attributes and options', () => {
      const mockSequelize = {};
      
      ClientInvitation.init(mockSequelize);
      
      const initCall = ClientInvitation.init.mock.calls[0];
      expect(initCall).toBeDefined();
      
      // Ensure the method was called with the sequelize instance
      expect(ClientInvitation.init).toHaveBeenCalledTimes(1);
      expect(ClientInvitation.init).toHaveBeenCalledWith(mockSequelize);
    });
  });
  
  describe('Model Associations', () => {
    it('should associate with User model', () => {
      // Mock User model
      const User = {};
      
      // Call associate method
      ClientInvitation.associate({ User });
      
      // Verify associations
      expect(ClientInvitation.belongsTo).toHaveBeenCalledTimes(3);
      expect(ClientInvitation.belongsTo).toHaveBeenCalledWith(User, { as: 'sender', foreignKey: 'sender_id' });
      expect(ClientInvitation.belongsTo).toHaveBeenCalledWith(User, { as: 'acceptedBy', foreignKey: 'accepted_by_user_id' });
      expect(ClientInvitation.belongsTo).toHaveBeenCalledWith(User, { as: 'revokedBy', foreignKey: 'revoked_by' });
    });
  });
}); 