const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authService = require('../../../../../src/modules/auth/services/auth.service');
const { AuthenticationError } = require('../../../../../src/shared/errors');

// Mock dependencies
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true)
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock_token'),
  verify: jest.fn().mockReturnValue({ sub: 'user_id', iat: Math.floor(Date.now() / 1000) })
}));

// Mock the User model
jest.mock('../../../../../src/modules/auth/models/User', () => ({
  findOne: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn(),
  update: jest.fn()
}));

// Mock the redis client
jest.mock('../../../../../src/shared/config/redis', () => ({
  set: jest.fn().mockResolvedValue('OK'),
  get: jest.fn().mockResolvedValue('user_id'),
  del: jest.fn().mockResolvedValue(1),
  multi: jest.fn().mockReturnValue({
    set: jest.fn().mockReturnThis(),
    expire: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(['OK', 'OK'])
  })
}));

describe('Authentication Service', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    test('should hash password correctly', async () => {
      const password = 'SecurePassword123!';
      const result = await authService.hashPassword(password);
      
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(result).toBe('hashed_password');
    });
  });

  describe('verifyPassword', () => {
    test('should return true for correct password', async () => {
      const password = 'SecurePassword123!';
      const hash = 'hashed_password';
      const result = await authService.verifyPassword(password, hash);
      
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(true);
    });

    test('should return false for incorrect password', async () => {
      bcrypt.compare.mockResolvedValueOnce(false);
      
      const password = 'WrongPassword123!';
      const hash = 'hashed_password';
      const result = await authService.verifyPassword(password, hash);
      
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(false);
    });
  });

  describe('generateTokens', () => {
    test('should generate access and refresh tokens', async () => {
      const userId = 'user_id';
      const result = await authService.generateTokens(userId);
      
      expect(jwt.sign).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('expiresIn');
    });
  });

  describe('validateCredentials', () => {
    test('should validate correct credentials', async () => {
      // Mock User.findOne to return a user
      const mockUser = {
        id: 'user_id',
        email: 'test@example.com',
        password: 'hashed_password',
        status: 'active'
      };
      
      const User = require('../../../../../src/modules/auth/models/User');
      User.findOne.mockResolvedValueOnce(mockUser);
      
      const credentials = {
        email: 'test@example.com',
        password: 'SecurePassword123!'
      };
      
      const result = await authService.validateCredentials(credentials);
      
      expect(User.findOne).toHaveBeenCalledWith({ where: { email: credentials.email } });
      expect(bcrypt.compare).toHaveBeenCalledWith(credentials.password, mockUser.password);
      expect(result).toHaveProperty('user');
      expect(result.user.id).toBe(mockUser.id);
    });

    test('should reject invalid email', async () => {
      // Mock User.findOne to return null (user not found)
      const User = require('../../../../../src/modules/auth/models/User');
      User.findOne.mockResolvedValueOnce(null);
      
      const credentials = {
        email: 'nonexistent@example.com',
        password: 'SecurePassword123!'
      };
      
      await expect(authService.validateCredentials(credentials))
        .rejects.toThrow(AuthenticationError);
      
      expect(User.findOne).toHaveBeenCalledWith({ where: { email: credentials.email } });
    });

    test('should reject invalid password', async () => {
      // Mock User.findOne to return a user
      const mockUser = {
        id: 'user_id',
        email: 'test@example.com',
        password: 'hashed_password',
        status: 'active'
      };
      
      const User = require('../../../../../src/modules/auth/models/User');
      User.findOne.mockResolvedValueOnce(mockUser);
      
      // Mock bcrypt.compare to return false (password doesn't match)
      bcrypt.compare.mockResolvedValueOnce(false);
      
      const credentials = {
        email: 'test@example.com',
        password: 'WrongPassword123!'
      };
      
      await expect(authService.validateCredentials(credentials))
        .rejects.toThrow(AuthenticationError);
      
      expect(User.findOne).toHaveBeenCalledWith({ where: { email: credentials.email } });
      expect(bcrypt.compare).toHaveBeenCalledWith(credentials.password, mockUser.password);
    });
  });

  describe('verifyToken', () => {
    test('should verify valid token', () => {
      const token = 'valid_token';
      const result = authService.verifyToken(token);
      
      expect(jwt.verify).toHaveBeenCalled();
      expect(result).toHaveProperty('sub', 'user_id');
    });

    test('should throw for invalid token', () => {
      // Mock jwt.verify to throw an error
      jwt.verify.mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });
      
      const token = 'invalid_token';
      
      expect(() => authService.verifyToken(token)).toThrow();
    });
  });

  // Additional test cases for other authentication service methods can be added here
}); 