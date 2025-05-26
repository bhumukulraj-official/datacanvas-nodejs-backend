const ClientInvitationRepository = require('../../../../src/data/repositories/auth/ClientInvitationRepository');
const { ClientInvitation } = require('../../../../src/data/models');
const { Op } = require('sequelize');

// Mock the models
jest.mock('../../../../src/data/models', () => {
  const mockSequelize = {
    col: jest.fn(col => `sequelize.col(${col})`),
    literal: jest.fn(expr => `sequelize.literal(${expr})`)
  };
  
  return {
    ClientInvitation: {
      findOne: jest.fn(),
      findAll: jest.fn(),
      sequelize: mockSequelize
    }
  };
});

describe('ClientInvitationRepository', () => {
  let repository;
  
  beforeEach(() => {
    repository = new ClientInvitationRepository();
    jest.clearAllMocks();
    
    // Mock the update method from BaseRepository
    repository.update = jest.fn();
  });

  test('constructor should set the model correctly', () => {
    expect(repository.model).toBe(ClientInvitation);
  });

  test('findByToken should call findOne with correct parameters', async () => {
    const mockToken = 'test-invitation-token';
    const mockResult = { id: 1, invitation_token: mockToken };
    ClientInvitation.findOne.mockResolvedValue(mockResult);

    const result = await repository.findByToken(mockToken);
    
    expect(ClientInvitation.findOne).toHaveBeenCalledWith({ 
      where: { invitation_token: mockToken } 
    });
    expect(result).toEqual(mockResult);
  });

  test('findByEmail should call findAll with correct parameters', async () => {
    const mockEmail = 'test@example.com';
    const mockResult = [
      { id: 1, email: mockEmail },
      { id: 2, email: mockEmail }
    ];
    ClientInvitation.findAll.mockResolvedValue(mockResult);

    const result = await repository.findByEmail(mockEmail);
    
    expect(ClientInvitation.findAll).toHaveBeenCalledWith({ 
      where: { email: mockEmail } 
    });
    expect(result).toEqual(mockResult);
  });

  test('findValidInvitation should call findOne with correct parameters', async () => {
    const mockToken = 'test-invitation-token';
    const mockResult = { id: 1, invitation_token: mockToken };
    ClientInvitation.findOne.mockResolvedValue(mockResult);
    
    const now = new Date();
    jest.spyOn(global, 'Date').mockImplementation(() => now);

    const result = await repository.findValidInvitation(mockToken);
    
    expect(ClientInvitation.findOne).toHaveBeenCalledWith({
      where: {
        invitation_token: mockToken,
        is_accepted: false,
        is_revoked: false,
        expires_at: { [Op.gt]: now },
        used_count: { [Op.lt]: ClientInvitation.sequelize.col('max_uses') }
      }
    });
    expect(result).toEqual(mockResult);
    
    global.Date.mockRestore();
  });

  test('markAsAccepted should call update with correct parameters', async () => {
    const mockId = 1;
    const mockUserId = 2;
    const mockResult = { id: mockId, is_accepted: true };
    repository.update.mockResolvedValue(mockResult);
    
    const now = new Date();
    jest.spyOn(global, 'Date').mockImplementation(() => now);
    
    const result = await repository.markAsAccepted(mockId, mockUserId);
    
    expect(repository.update).toHaveBeenCalledWith(mockId, {
      is_accepted: true,
      accepted_at: now,
      accepted_by_user_id: mockUserId,
      used_count: ClientInvitation.sequelize.literal('used_count + 1')
    });
    expect(result).toEqual(mockResult);
    
    global.Date.mockRestore();
  });

  test('revokeInvitation should call update with correct parameters', async () => {
    const mockId = 1;
    const mockRevokedById = 2;
    const mockResult = { id: mockId, is_revoked: true };
    repository.update.mockResolvedValue(mockResult);
    
    const now = new Date();
    jest.spyOn(global, 'Date').mockImplementation(() => now);
    
    const result = await repository.revokeInvitation(mockId, mockRevokedById);
    
    expect(repository.update).toHaveBeenCalledWith(mockId, {
      is_revoked: true,
      revoked_at: now,
      revoked_by: mockRevokedById
    });
    expect(result).toEqual(mockResult);
    
    global.Date.mockRestore();
  });

  test('findBySenderId should call findAll with correct parameters', async () => {
    const mockSenderId = 1;
    const mockResult = [
      { id: 1, sender_id: mockSenderId },
      { id: 2, sender_id: mockSenderId }
    ];
    ClientInvitation.findAll.mockResolvedValue(mockResult);

    const result = await repository.findBySenderId(mockSenderId);
    
    expect(ClientInvitation.findAll).toHaveBeenCalledWith({ 
      where: { sender_id: mockSenderId } 
    });
    expect(result).toEqual(mockResult);
  });
}); 