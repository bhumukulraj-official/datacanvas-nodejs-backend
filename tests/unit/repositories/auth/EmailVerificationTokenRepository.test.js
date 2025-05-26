const EmailVerificationTokenRepository = require('../../../../src/data/repositories/auth/EmailVerificationTokenRepository');
const { EmailVerificationToken } = require('../../../../src/data/models');

// Mock the models
jest.mock('../../../../src/data/models', () => ({
  EmailVerificationToken: {
    findOne: jest.fn(),
    destroy: jest.fn()
  }
}));

describe('EmailVerificationTokenRepository', () => {
  let repository;
  
  beforeEach(() => {
    repository = new EmailVerificationTokenRepository();
    jest.clearAllMocks();
  });

  test('constructor should set the model correctly', () => {
    expect(repository.model).toBe(EmailVerificationToken);
  });

  test('findByToken should call findOne with correct parameters', async () => {
    const token = 'verification-token-123';
    const mockToken = { id: 1, token, user_id: 5 };
    EmailVerificationToken.findOne.mockResolvedValue(mockToken);

    const result = await repository.findByToken(token);
    
    expect(EmailVerificationToken.findOne).toHaveBeenCalledWith({ where: { token } });
    expect(result).toEqual(mockToken);
  });

  test('deleteForUser should call destroy with correct parameters', async () => {
    const userId = 5;
    const deleteResult = 1; // Number of rows deleted
    EmailVerificationToken.destroy.mockResolvedValue(deleteResult);

    const result = await repository.deleteForUser(userId);
    
    expect(EmailVerificationToken.destroy).toHaveBeenCalledWith({ where: { user_id: userId } });
    expect(result).toEqual(deleteResult);
  });
}); 