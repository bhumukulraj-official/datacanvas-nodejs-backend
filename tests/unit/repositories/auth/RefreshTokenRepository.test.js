const RefreshTokenRepository = require('../../../../src/data/repositories/auth/RefreshTokenRepository');
const { RefreshToken } = require('../../../../src/data/models');
const { Op } = require('sequelize');

// Mock the models
jest.mock('../../../../src/data/models', () => ({
  RefreshToken: {
    findOne: jest.fn(),
    update: jest.fn(),
    findAll: jest.fn()
  }
}));

describe('RefreshTokenRepository', () => {
  let repository;
  
  beforeEach(() => {
    repository = new RefreshTokenRepository();
    jest.clearAllMocks();
  });

  test('constructor should set the model correctly', () => {
    expect(repository.model).toBe(RefreshToken);
  });

  test('findByToken should call findOne with correct parameters', async () => {
    const mockToken = 'test-token';
    const mockResult = { id: 1, token: mockToken, user_id: 1 };
    RefreshToken.findOne.mockResolvedValue(mockResult);

    const result = await repository.findByToken(mockToken);
    
    expect(RefreshToken.findOne).toHaveBeenCalledWith({ 
      where: { token: mockToken } 
    });
    expect(result).toEqual(mockResult);
  });

  test('revokeToken should call update with correct parameters', async () => {
    const mockToken = 'test-token';
    const mockResult = [1]; // Number of affected rows
    RefreshToken.update.mockResolvedValue(mockResult);

    const result = await repository.revokeToken(mockToken);
    
    expect(RefreshToken.update).toHaveBeenCalledWith(
      { is_revoked: true },
      { where: { token: mockToken } }
    );
    expect(result).toEqual(mockResult);
  });

  test('revokeAllForUser should call update with correct parameters', async () => {
    const mockUserId = 1;
    const mockResult = [2]; // Number of affected rows
    RefreshToken.update.mockResolvedValue(mockResult);

    const result = await repository.revokeAllForUser(mockUserId);
    
    expect(RefreshToken.update).toHaveBeenCalledWith(
      { is_revoked: true },
      { where: { user_id: mockUserId } }
    );
    expect(result).toEqual(mockResult);
  });

  test('getActiveTokensForUser should call findAll with correct parameters', async () => {
    const mockUserId = 1;
    const mockTokens = [
      { id: 1, token: 'token1', user_id: mockUserId, is_revoked: false },
      { id: 2, token: 'token2', user_id: mockUserId, is_revoked: false }
    ];
    RefreshToken.findAll.mockResolvedValue(mockTokens);
    
    const now = new Date();
    jest.spyOn(global, 'Date').mockImplementation(() => now);

    const result = await repository.getActiveTokensForUser(mockUserId);
    
    expect(RefreshToken.findAll).toHaveBeenCalledWith({
      where: {
        user_id: mockUserId,
        is_revoked: false,
        expires_at: { [Op.gt]: now }
      }
    });
    expect(result).toEqual(mockTokens);
    
    global.Date.mockRestore();
  });
}); 