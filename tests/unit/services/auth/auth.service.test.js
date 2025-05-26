const authService = require('../../../../src/services/auth/auth.service');
const UserRepository = require('../../../../src/data/repositories/auth/UserRepository');
const RefreshTokenRepository = require('../../../../src/data/repositories/auth/RefreshTokenRepository');
const EmailVerificationTokenRepository = require('../../../../src/data/repositories/auth/EmailVerificationTokenRepository');
const passwordUtil = require('../../../../src/utils/password.util');
const jwtUtil = require('../../../../src/utils/jwt.util');
const { CustomError, InvalidCredentialsError, TokenExpiredError } = require('../../../../src/utils/error.util');
const { transporter } = require('../../../../src/config/email');
const logger = require('../../../../src/utils/logger.util');
const crypto = require('crypto');

// Mock the repositories
jest.mock('../../../../src/data/repositories/auth/UserRepository');
jest.mock('../../../../src/data/repositories/auth/RefreshTokenRepository');
jest.mock('../../../../src/data/repositories/auth/EmailVerificationTokenRepository');

// Mock utilities
jest.mock('../../../../src/utils/password.util', () => ({
  verifyPassword: jest.fn(),
  hashPassword: jest.fn()
}));

jest.mock('../../../../src/utils/jwt.util', () => ({
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn()
}));

// Mock email transporter
jest.mock('../../../../src/config/email', () => ({
  transporter: {
    sendMail: jest.fn()
  },
  templatePaths: {}
}));

// Mock logger
jest.mock('../../../../src/utils/logger.util', () => ({
  info: jest.fn(),
  error: jest.fn()
}));

// Mock crypto
jest.mock('crypto', () => ({
  randomBytes: jest.fn()
}));

describe('AuthService', () => {
  let mockUserRepository;
  let mockRefreshTokenRepository;
  let mockEmailVerificationTokenRepository;
  
  beforeEach(() => {
    // Create new instances of mocked repositories
    mockUserRepository = new UserRepository();
    mockRefreshTokenRepository = new RefreshTokenRepository();
    mockEmailVerificationTokenRepository = new EmailVerificationTokenRepository();
    
    // Reset mock implementations
    jest.clearAllMocks();
    
    // Mock repositories on the service
    authService.userRepository = mockUserRepository;
    authService.refreshTokenRepository = mockRefreshTokenRepository;
    authService.emailVerificationTokenRepository = mockEmailVerificationTokenRepository;
    
    // Mock the sanitize user function
    authService._sanitizeUser = jest.fn(user => {
      const { password_hash, ...userData } = user.get({ plain: true });
      return userData;
    });
  });

  describe('login', () => {
    test('should login successfully with valid credentials', async () => {
      // Mock user with roles
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password_hash: 'hashed_password',
        UserRoles: [{ role: 'USER' }],
        get: jest.fn().mockReturnValue({
          id: 1,
          email: 'test@example.com',
          password_hash: 'hashed_password',
          UserRoles: [{ role: 'USER' }]
        })
      };
      
      // Mock repository and utility functions
      mockUserRepository.findByEmail = jest.fn().mockResolvedValue(mockUser);
      passwordUtil.verifyPassword = jest.fn().mockResolvedValue(true);
      
      jwtUtil.generateAccessToken = jest.fn().mockResolvedValue('access_token_123');
      jwtUtil.generateRefreshToken = jest.fn().mockResolvedValue('refresh_token_123');
      
      mockRefreshTokenRepository.create = jest.fn().mockResolvedValue({
        id: 1,
        token: 'refresh_token_123',
        user_id: 1,
        expires_at: expect.any(Date)
      });
      
      // Call the service method
      const result = await authService.login('test@example.com', 'password123');
      
      // Assertions
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(passwordUtil.verifyPassword).toHaveBeenCalledWith('password123', 'hashed_password');
      
      expect(jwtUtil.generateAccessToken).toHaveBeenCalledWith({
        id: 1,
        email: 'test@example.com',
        roles: ['USER']
      });
      
      expect(jwtUtil.generateRefreshToken).toHaveBeenCalledWith({ id: 1 });
      
      expect(mockRefreshTokenRepository.create).toHaveBeenCalledWith({
        token: 'refresh_token_123',
        user_id: 1,
        expires_at: expect.any(Date)
      });
      
      expect(authService._sanitizeUser).toHaveBeenCalled();
      
      expect(result).toEqual({
        user: expect.any(Object),
        tokens: {
          accessToken: 'access_token_123',
          refreshToken: 'refresh_token_123'
        }
      });
    });
    
    test('should throw error for non-existent email', async () => {
      // Mock repository to return null (user not found)
      mockUserRepository.findByEmail = jest.fn().mockResolvedValue(null);
      
      // Call the service method and expect it to throw
      await expect(
        authService.login('nonexistent@example.com', 'password123')
      ).rejects.toThrow(InvalidCredentialsError);
      
      // Assertions
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('nonexistent@example.com');
      expect(passwordUtil.verifyPassword).not.toHaveBeenCalled();
    });

    test('should throw error for incorrect password', async () => {
      // Mock user
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password_hash: 'hashed_password'
      };
      
      // Mock repository and utility functions
      mockUserRepository.findByEmail = jest.fn().mockResolvedValue(mockUser);
      passwordUtil.verifyPassword = jest.fn().mockResolvedValue(false); // Invalid password
      
      // Call the service method and expect it to throw
      await expect(
        authService.login('test@example.com', 'wrong_password')
      ).rejects.toThrow(InvalidCredentialsError);
      
      // Assertions
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(passwordUtil.verifyPassword).toHaveBeenCalledWith('wrong_password', 'hashed_password');
      expect(jwtUtil.generateAccessToken).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    test('should revoke refresh token on logout', async () => {
      // Mock repository
      mockRefreshTokenRepository.revokeToken = jest.fn().mockResolvedValue(true);
      
      // Call the service method
      const result = await authService.logout('refresh_token_123');
      
      // Assertions
      expect(mockRefreshTokenRepository.revokeToken).toHaveBeenCalledWith('refresh_token_123');
      expect(result).toEqual({ success: true });
    });
  });

  describe('refreshToken', () => {
    test('should refresh tokens successfully with valid refresh token', async () => {
      // Mock token document
      const mockTokenDoc = {
        id: 1,
        token: 'refresh_token_123',
        user_id: 1,
        is_revoked: false,
        expires_at: new Date(Date.now() + 3600000) // 1 hour in the future
      };
      
      // Mock user with roles
      const mockUser = {
        id: 1,
        email: 'test@example.com',
          UserRoles: [{ role: 'USER' }]
      };
      
      // Mock repository and utility functions
      mockRefreshTokenRepository.findByToken = jest.fn().mockResolvedValue(mockTokenDoc);
      mockUserRepository.findById = jest.fn().mockResolvedValue(mockUser);
      
      jwtUtil.generateAccessToken = jest.fn().mockResolvedValue('new_access_token');
      jwtUtil.generateRefreshToken = jest.fn().mockResolvedValue('new_refresh_token');
      
      mockRefreshTokenRepository.revokeToken = jest.fn().mockResolvedValue(true);
      mockRefreshTokenRepository.create = jest.fn().mockResolvedValue({
        token: 'new_refresh_token',
        user_id: 1,
        expires_at: expect.any(Date)
      });
      
      // Call the service method
      const result = await authService.refreshToken('refresh_token_123');
      
      // Assertions
      expect(mockRefreshTokenRepository.findByToken).toHaveBeenCalledWith('refresh_token_123');
      expect(mockUserRepository.findById).toHaveBeenCalledWith(1);
      
      expect(jwtUtil.generateAccessToken).toHaveBeenCalledWith({
        id: 1,
        email: 'test@example.com',
        roles: ['USER']
      });
      
      expect(jwtUtil.generateRefreshToken).toHaveBeenCalledWith({ id: 1 });
      
      expect(mockRefreshTokenRepository.revokeToken).toHaveBeenCalledWith('refresh_token_123');
      expect(mockRefreshTokenRepository.create).toHaveBeenCalledWith({
        token: 'new_refresh_token',
        user_id: 1,
        expires_at: expect.any(Date)
      });
      
      expect(result).toEqual({
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token'
      });
    });
    
    test('should throw error for expired refresh token', async () => {
      // Mock expired token document
      const mockExpiredToken = {
        id: 1,
        token: 'expired_token',
        user_id: 1,
        is_revoked: false,
        expires_at: new Date(Date.now() - 3600000) // 1 hour in the past
      };
      
      // Mock repository
      mockRefreshTokenRepository.findByToken = jest.fn().mockResolvedValue(mockExpiredToken);
      
      // Call the service method and expect it to throw
      await expect(
        authService.refreshToken('expired_token')
      ).rejects.toThrow(TokenExpiredError);
      
      // Assertions
      expect(mockRefreshTokenRepository.findByToken).toHaveBeenCalledWith('expired_token');
      expect(mockUserRepository.findById).not.toHaveBeenCalled();
    });
    
    test('should throw error for revoked refresh token', async () => {
      // Mock revoked token document
      const mockRevokedToken = {
        id: 1,
        token: 'revoked_token',
        user_id: 1,
        is_revoked: true,
        expires_at: new Date(Date.now() + 3600000) // Still valid time
      };
      
      // Mock repository
      mockRefreshTokenRepository.findByToken = jest.fn().mockResolvedValue(mockRevokedToken);
      
      // Call the service method and expect it to throw
      await expect(
        authService.refreshToken('revoked_token')
      ).rejects.toThrow(TokenExpiredError);
      
      // Assertions
      expect(mockRefreshTokenRepository.findByToken).toHaveBeenCalledWith('revoked_token');
      expect(mockUserRepository.findById).not.toHaveBeenCalled();
    });
    
    test('should throw error if user not found', async () => {
      // Mock token document
      const mockTokenDoc = {
        id: 1,
        token: 'refresh_token_123',
        user_id: 999, // Non-existent user
        is_revoked: false,
        expires_at: new Date(Date.now() + 3600000)
      };
      
      // Mock repository
      mockRefreshTokenRepository.findByToken = jest.fn().mockResolvedValue(mockTokenDoc);
      mockUserRepository.findById = jest.fn().mockResolvedValue(null); // User not found
      
      // Call the service method and expect it to throw
      await expect(
        authService.refreshToken('refresh_token_123')
      ).rejects.toThrow(CustomError);
      
      // Assertions
      expect(mockRefreshTokenRepository.findByToken).toHaveBeenCalledWith('refresh_token_123');
      expect(mockUserRepository.findById).toHaveBeenCalledWith(999);
      expect(jwtUtil.generateAccessToken).not.toHaveBeenCalled();
    });
  });

  describe('verifyEmail', () => {
    test('should verify email successfully with valid token', async () => {
      // Mock verification token
      const mockVerificationToken = {
        id: 1,
        token: 'verify_token_123',
        user_id: 1,
        expires_at: new Date(Date.now() + 3600000) // 1 hour in the future
      };
      
      // Mock repository methods
      mockEmailVerificationTokenRepository.findByToken = jest.fn().mockResolvedValue(mockVerificationToken);
      mockUserRepository.verifyEmail = jest.fn().mockResolvedValue([1]);
      mockEmailVerificationTokenRepository.deleteForUser = jest.fn().mockResolvedValue(1);
      
      // Call the service method
      const result = await authService.verifyEmail('verify_token_123');
      
      // Assertions
      expect(mockEmailVerificationTokenRepository.findByToken).toHaveBeenCalledWith('verify_token_123');
      expect(mockUserRepository.verifyEmail).toHaveBeenCalledWith(1);
      expect(mockEmailVerificationTokenRepository.deleteForUser).toHaveBeenCalledWith(1);
      expect(result).toEqual({ success: true });
    });
    
    test('should throw error for invalid verification token', async () => {
      // Mock repository to return null (token not found)
      mockEmailVerificationTokenRepository.findByToken = jest.fn().mockResolvedValue(null);
      
      // Call the service method and expect it to throw
      await expect(
        authService.verifyEmail('invalid_token')
      ).rejects.toThrow(CustomError);
      
      // Assertions
      expect(mockEmailVerificationTokenRepository.findByToken).toHaveBeenCalledWith('invalid_token');
      expect(mockUserRepository.verifyEmail).not.toHaveBeenCalled();
    });
    
    test('should throw error for expired verification token', async () => {
      // Mock expired verification token
      const mockExpiredToken = {
        id: 1,
        token: 'expired_token',
        user_id: 1,
        expires_at: new Date(Date.now() - 3600000) // 1 hour in the past
      };
      
      // Mock repository
      mockEmailVerificationTokenRepository.findByToken = jest.fn().mockResolvedValue(mockExpiredToken);
      
      // Call the service method and expect it to throw
      await expect(
        authService.verifyEmail('expired_token')
      ).rejects.toThrow(CustomError);
      
      // Assertions
      expect(mockEmailVerificationTokenRepository.findByToken).toHaveBeenCalledWith('expired_token');
      expect(mockUserRepository.verifyEmail).not.toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    test('should change password successfully with valid current password', async () => {
      // Mock user
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password_hash: 'current_hashed_password'
      };
      
      // Mock repository and utility functions
      mockUserRepository.findById = jest.fn().mockResolvedValue(mockUser);
      passwordUtil.verifyPassword = jest.fn().mockResolvedValue(true);
      passwordUtil.hashPassword = jest.fn().mockResolvedValue('new_hashed_password');
      
      mockUserRepository.updatePassword = jest.fn().mockResolvedValue([1]);
      mockRefreshTokenRepository.revokeAllForUser = jest.fn().mockResolvedValue(5); // 5 tokens revoked
      
      // Call the service method
      const result = await authService.changePassword(1, 'current_password', 'new_password');
      
      // Assertions
      expect(mockUserRepository.findById).toHaveBeenCalledWith(1);
      expect(passwordUtil.verifyPassword).toHaveBeenCalledWith('current_password', 'current_hashed_password');
      expect(passwordUtil.hashPassword).toHaveBeenCalledWith('new_password');
      expect(mockUserRepository.updatePassword).toHaveBeenCalledWith(1, 'new_hashed_password');
      expect(mockRefreshTokenRepository.revokeAllForUser).toHaveBeenCalledWith(1);
      expect(result).toEqual({ success: true });
    });
    
    test('should throw error if user not found', async () => {
      // Mock repository to return null (user not found)
      mockUserRepository.findById = jest.fn().mockResolvedValue(null);
      
      // Call the service method and expect it to throw
      await expect(
        authService.changePassword(999, 'current_password', 'new_password')
      ).rejects.toThrow(CustomError);
      
      // Assertions
      expect(mockUserRepository.findById).toHaveBeenCalledWith(999);
      expect(passwordUtil.verifyPassword).not.toHaveBeenCalled();
    });
    
    test('should throw error for incorrect current password', async () => {
      // Mock user
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password_hash: 'current_hashed_password'
      };
      
      // Mock repository and utility functions
      mockUserRepository.findById = jest.fn().mockResolvedValue(mockUser);
      passwordUtil.verifyPassword = jest.fn().mockResolvedValue(false); // Invalid password
      
      // Call the service method and expect it to throw
      await expect(
        authService.changePassword(1, 'wrong_password', 'new_password')
      ).rejects.toThrow(InvalidCredentialsError);
      
      // Assertions
      expect(mockUserRepository.findById).toHaveBeenCalledWith(1);
      expect(passwordUtil.verifyPassword).toHaveBeenCalledWith('wrong_password', 'current_hashed_password');
      expect(passwordUtil.hashPassword).not.toHaveBeenCalled();
    });
    
    test('should throw error for password that does not meet requirements', async () => {
      // Mock user
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password_hash: 'current_hashed_password'
      };
      
      // Mock repository and utility functions
      mockUserRepository.findById = jest.fn().mockResolvedValue(mockUser);
      passwordUtil.verifyPassword = jest.fn().mockResolvedValue(true);
      
      // Call the service method with short password and expect it to throw
      await expect(
        authService.changePassword(1, 'current_password', 'short')
      ).rejects.toThrow(CustomError);
      
      // Assertions
      expect(mockUserRepository.findById).toHaveBeenCalledWith(1);
      expect(passwordUtil.verifyPassword).toHaveBeenCalledWith('current_password', 'current_hashed_password');
      expect(passwordUtil.hashPassword).not.toHaveBeenCalled();
    });
  });
}); 