const passwordService = require('../../../../src/services/auth/password.service');
const UserRepository = require('../../../../src/data/repositories/auth/UserRepository');
const EmailVerificationTokenRepository = require('../../../../src/data/repositories/auth/EmailVerificationTokenRepository');
const passwordUtil = require('../../../../src/utils/password.util');
const { CustomError } = require('../../../../src/utils/error.util');

// Mock the repositories
jest.mock('../../../../src/data/repositories/auth/UserRepository');
jest.mock('../../../../src/data/repositories/auth/EmailVerificationTokenRepository');

// Mock the password utility
jest.mock('../../../../src/utils/password.util', () => ({
  generateRandomToken: jest.fn(),
  hashPassword: jest.fn()
}));

describe('PasswordService', () => {
  let mockUserRepository;
  let mockTokenRepository;
  
  beforeEach(() => {
    // Create new instances of mocked repositories
    mockUserRepository = new UserRepository();
    mockTokenRepository = new EmailVerificationTokenRepository();
    
    // Reset mock implementations
    jest.clearAllMocks();
    
    // Mock repositories on the service
    passwordService.userRepo = mockUserRepository;
    passwordService.tokenRepo = mockTokenRepository;
  });

  describe('requestPasswordReset', () => {
    test('should generate reset token for existing user', async () => {
      const email = 'user@example.com';
      const token = 'random_token_123';
      
      // Mock user
      const mockUser = {
        id: 1,
        email,
        name: 'Test User'
      };
      
      // Mock repository methods
      mockUserRepository.findByEmail = jest.fn().mockResolvedValue(mockUser);
      passwordUtil.generateRandomToken.mockReturnValue(token);
      mockTokenRepository.create = jest.fn().mockResolvedValue({
        id: 1,
        token,
        user_id: mockUser.id,
        expires_at: expect.any(Date)
      });
      
      // Call the service method
      const result = await passwordService.requestPasswordReset(email);
      
      // Assertions
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(passwordUtil.generateRandomToken).toHaveBeenCalledWith(32);
      expect(mockTokenRepository.create).toHaveBeenCalledWith({
        token,
        user_id: mockUser.id,
        expires_at: expect.any(Date)
      });
      expect(result).toEqual({ success: true });
    });
    
    test('should return success even if user does not exist (prevent email enumeration)', async () => {
      const email = 'nonexistent@example.com';
      
      // Mock repository to return null (user not found)
      mockUserRepository.findByEmail = jest.fn().mockResolvedValue(null);
      
      // Call the service method
      const result = await passwordService.requestPasswordReset(email);
      
      // Assertions
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(passwordUtil.generateRandomToken).not.toHaveBeenCalled();
      expect(mockTokenRepository.create).not.toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });

  describe('resetPassword', () => {
    test('should reset password with valid token', async () => {
      const token = 'valid_token_123';
      const newPassword = 'new_password123';
      const hashedPassword = 'hashed_new_password';
      
      // Mock token record
      const mockTokenRecord = {
        id: 1,
        token,
        user_id: 1,
        expires_at: new Date(Date.now() + 3600000) // 1 hour in the future
      };
      
      // Mock repository and utility methods
      mockTokenRepository.findByToken = jest.fn().mockResolvedValue(mockTokenRecord);
      passwordUtil.hashPassword.mockResolvedValue(hashedPassword);
      mockUserRepository.updatePassword = jest.fn().mockResolvedValue([1]);
      mockTokenRepository.deleteForUser = jest.fn().mockResolvedValue(1);
      
      // Call the service method
      const result = await passwordService.resetPassword(token, newPassword);
      
      // Assertions
      expect(mockTokenRepository.findByToken).toHaveBeenCalledWith(token);
      expect(passwordUtil.hashPassword).toHaveBeenCalledWith(newPassword);
      expect(mockUserRepository.updatePassword).toHaveBeenCalledWith(1, hashedPassword);
      expect(mockTokenRepository.deleteForUser).toHaveBeenCalledWith(1);
      expect(result).toEqual({ success: true });
    });
    
    test('should throw error for invalid token', async () => {
      const token = 'invalid_token';
      const newPassword = 'new_password123';
      
      // Mock repository to return null (token not found)
      mockTokenRepository.findByToken = jest.fn().mockResolvedValue(null);
      
      // Call the service method and expect it to throw
      await expect(
        passwordService.resetPassword(token, newPassword)
      ).rejects.toThrow(CustomError);
      
      // Assertions
      expect(mockTokenRepository.findByToken).toHaveBeenCalledWith(token);
      expect(passwordUtil.hashPassword).not.toHaveBeenCalled();
      expect(mockUserRepository.updatePassword).not.toHaveBeenCalled();
    });
    
    test('should throw error for expired token', async () => {
      const token = 'expired_token';
      const newPassword = 'new_password123';
      
      // Mock expired token record
      const mockExpiredToken = {
        id: 1,
        token,
        user_id: 1,
        expires_at: new Date(Date.now() - 3600000) // 1 hour in the past
      };
      
      // Mock repository
      mockTokenRepository.findByToken = jest.fn().mockResolvedValue(mockExpiredToken);
      
      // Call the service method and expect it to throw
      await expect(
        passwordService.resetPassword(token, newPassword)
      ).rejects.toThrow(CustomError);
      
      // Assertions
      expect(mockTokenRepository.findByToken).toHaveBeenCalledWith(token);
      expect(passwordUtil.hashPassword).not.toHaveBeenCalled();
      expect(mockUserRepository.updatePassword).not.toHaveBeenCalled();
    });
  });
}); 