const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Mock dependencies
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('uuid');
jest.mock('src/modules/auth/models/User');
jest.mock('src/modules/auth/models/RefreshToken');
jest.mock('src/modules/auth/models/EmailVerificationToken');
jest.mock('src/modules/auth/models/AuditLog');
jest.mock('src/shared/utils/logger');

// Importing the mocks for use in tests
const User = require('src/modules/auth/models/User');
const RefreshToken = require('src/modules/auth/models/RefreshToken');
const EmailVerificationToken = require('src/modules/auth/models/EmailVerificationToken');
const logger = require('src/shared/utils/logger');
const config = require('src/shared/config');

// Import the service to test
const AuthService = require('src/modules/auth/services/auth.service');

describe('AuthService', () => {
  let authService;
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Create a new instance of the service
    authService = new AuthService();
  });
  
  describe('register', () => {
    const mockUserData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123!',
      first_name: 'Test',
      last_name: 'User'
    };
    
    const mockIp = '127.0.0.1';
    
    it('should throw an error if email already exists', async () => {
      // Setup
      User.findOne.mockResolvedValueOnce({ id: 1, email: mockUserData.email });
      
      // Execute and Assert
      await expect(authService.register(mockUserData, mockIp))
        .rejects.toThrow('Email already exists');
    });
    
    it('should throw an error if username already exists', async () => {
      // Setup
      User.findOne.mockResolvedValueOnce(null); // Email doesn't exist
      User.findOne.mockResolvedValueOnce({ id: 1, username: mockUserData.username });
      
      // Execute and Assert
      await expect(authService.register(mockUserData, mockIp))
        .rejects.toThrow('Username already exists');
    });
    
    it('should create a new user with hashed password', async () => {
      // Setup
      User.findOne.mockResolvedValue(null); // No existing user
      bcrypt.genSalt.mockResolvedValue('mockSalt');
      bcrypt.hash.mockResolvedValue('hashedPassword');
      
      const mockCreatedUser = {
        id: 1,
        ...mockUserData,
        password: 'hashedPassword',
        password_salt: 'mockSalt',
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          username: mockUserData.username,
          email: mockUserData.email,
          password: 'hashedPassword',
          password_salt: 'mockSalt'
        })
      };
      
      User.create.mockResolvedValue(mockCreatedUser);
      
      uuidv4.mockReturnValue('mock-verification-token');
      EmailVerificationToken.create.mockResolvedValue({});
      
      // Save the current NODE_ENV
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      // Execute
      const result = await authService.register(mockUserData, mockIp);
      
      // Assert
      expect(User.create).toHaveBeenCalledWith({
        username: mockUserData.username,
        email: mockUserData.email,
        password: 'hashedPassword',
        password_salt: 'mockSalt',
        first_name: mockUserData.first_name,
        last_name: mockUserData.last_name,
        role: 'user',
        status: 'active',
        is_email_verified: false
      });
      
      expect(EmailVerificationToken.create).toHaveBeenCalledWith({
        user_id: 1,
        token: 'mock-verification-token',
        expires_at: expect.any(Date)
      });
      
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('password_salt');
      expect(result).toHaveProperty('verification_token', 'mock-verification-token');
      
      // Restore NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
    });
  });
  
  describe('login', () => {
    const mockEmail = 'test@example.com';
    const mockPassword = 'Password123!';
    const mockIp = '127.0.0.1';
    const mockUserAgent = 'Mozilla/5.0';
    
    it('should throw an error if user not found', async () => {
      // Setup
      User.findOne.mockResolvedValue(null);
      
      // Execute and Assert
      await expect(authService.login(mockEmail, mockPassword, mockIp, mockUserAgent))
        .rejects.toThrow('Invalid credentials');
    });
    
    it('should throw an error if account is locked', async () => {
      // Setup
      const mockUser = {
        id: 1,
        email: mockEmail,
        locked_until: new Date(Date.now() + 3600000) // 1 hour in the future
      };
      
      User.findOne.mockResolvedValue(mockUser);
      
      // Execute and Assert
      await expect(authService.login(mockEmail, mockPassword, mockIp, mockUserAgent))
        .rejects.toThrow(/Account locked/);
    });
    
    it('should throw an error if account status is not active', async () => {
      // Setup
      const mockUser = {
        id: 1,
        email: mockEmail,
        status: 'suspended',
        locked_until: null
      };
      
      User.findOne.mockResolvedValue(mockUser);
      
      // Execute and Assert
      await expect(authService.login(mockEmail, mockPassword, mockIp, mockUserAgent))
        .rejects.toThrow(/Account is temporarily suspended/);
    });
    
    it('should throw an error if password is invalid', async () => {
      // Setup
      const mockUser = {
        id: 1,
        email: mockEmail,
        password: 'hashedPassword',
        status: 'active',
        locked_until: null,
        login_attempts: 0,
        save: jest.fn().mockResolvedValue({})
      };
      
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);
      
      // Execute and Assert
      await expect(authService.login(mockEmail, mockPassword, mockIp, mockUserAgent))
        .rejects.toThrow('Invalid credentials');
      
      expect(mockUser.login_attempts).toBe(1);
      expect(mockUser.save).toHaveBeenCalled();
    });
    
    it('should lock account after 5 failed login attempts', async () => {
      // Setup
      const mockUser = {
        id: 1,
        email: mockEmail,
        password: 'hashedPassword',
        status: 'active',
        locked_until: null,
        login_attempts: 4, // One more attempt will reach 5
        save: jest.fn().mockResolvedValue({})
      };
      
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);
      
      // Execute and Assert
      await expect(authService.login(mockEmail, mockPassword, mockIp, mockUserAgent))
        .rejects.toThrow('Invalid credentials');
      
      expect(mockUser.login_attempts).toBe(5);
      expect(mockUser.locked_until).not.toBeNull();
      expect(mockUser.save).toHaveBeenCalled();
    });
    
    it('should return user data and tokens on successful login', async () => {
      // Setup
      const mockUser = {
        id: 1,
        email: mockEmail,
        password: 'hashedPassword',
        status: 'active',
        locked_until: null,
        login_attempts: 2,
        last_login: null,
        save: jest.fn().mockResolvedValue({}),
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          email: mockEmail,
          password: 'hashedPassword',
          role: 'user'
        })
      };
      
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      
      authService.generateJwtToken = jest.fn().mockReturnValue({
        token: 'mock-jwt-token',
        expiresIn: 3600
      });
      
      authService.generateRefreshToken = jest.fn().mockResolvedValue({
        id: 1,
        token: 'mock-refresh-token',
        user_id: 1,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
      
      // Execute
      const result = await authService.login(mockEmail, mockPassword, mockIp, mockUserAgent);
      
      // Assert
      expect(mockUser.login_attempts).toBe(0);
      expect(mockUser.locked_until).toBeNull();
      expect(mockUser.last_login).not.toBeNull();
      expect(mockUser.save).toHaveBeenCalled();
      
      expect(result).toEqual({
        user: expect.objectContaining({
          id: 1,
          email: mockEmail,
          role: 'user'
        }),
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer'
      });
      
      expect(result.user).not.toHaveProperty('password');
    });
  });
  
  // Additional tests could be added for other methods like:
  // - refreshToken
  // - logout
  // - logoutAll
  // - changePassword
  // - etc.
}); 