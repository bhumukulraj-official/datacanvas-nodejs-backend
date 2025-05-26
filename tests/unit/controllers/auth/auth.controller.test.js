const { AuthController } = require('../../../../src/api/controllers/auth');
const { AuthService, PasswordService } = require('../../../../src/services/auth');
const { CustomError } = require('../../../../src/utils/error.util');
const logger = require('../../../../src/utils/logger.util');

// Mock dependencies
jest.mock('../../../../src/services/auth', () => ({
  AuthService: {
    login: jest.fn(),
    logout: jest.fn(),
    refreshToken: jest.fn(),
    verifyEmail: jest.fn(),
    resendVerificationEmail: jest.fn(),
    changePassword: jest.fn()
  },
  PasswordService: {
    requestPasswordReset: jest.fn(),
    resetPassword: jest.fn()
  }
}));

jest.mock('../../../../src/utils/error.util', () => ({
  CustomError: jest.fn()
}));

jest.mock('../../../../src/utils/logger.util', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  error: jest.fn()
}));

describe('AuthController', () => {
  let req, res, next;
  
  beforeEach(() => {
    req = {
      body: {}
    };
    res = {
      json: jest.fn()
    };
    next = jest.fn();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('login', () => {
    beforeEach(() => {
      req.body = {
        email: 'test@example.com',
        password: 'password123'
      };
    });
    
    it('should login a user successfully', async () => {
      // Arrange
      const loginResult = {
        user: { id: 'user-123', email: 'test@example.com' },
        tokens: { accessToken: 'access-token', refreshToken: 'refresh-token' }
      };
      AuthService.login.mockResolvedValue(loginResult);
      
      // Act
      await AuthController.login(req, res, next);
      
      // Assert
      expect(AuthService.login).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(logger.debug).toHaveBeenCalledWith('Login attempt', { email: 'test@example.com' });
      expect(logger.info).toHaveBeenCalledWith('Successful login', { email: 'test@example.com' });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: loginResult
      });
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should call next with error if login fails', async () => {
      // Arrange
      const error = new Error('Invalid credentials');
      AuthService.login.mockRejectedValue(error);
      
      // Act
      await AuthController.login(req, res, next);
      
      // Assert
      expect(AuthService.login).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(logger.debug).toHaveBeenCalledWith('Login attempt', { email: 'test@example.com' });
      expect(logger.error).toHaveBeenCalledWith('Login failed', { error: error.message, email: 'test@example.com' });
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });
  
  describe('logout', () => {
    beforeEach(() => {
      req.body = {
        refreshToken: 'refresh-token-123'
      };
    });
    
    it('should logout a user successfully', async () => {
      // Arrange
      AuthService.logout.mockResolvedValue(true);
      
      // Act
      await AuthController.logout(req, res, next);
      
      // Assert
      expect(AuthService.logout).toHaveBeenCalledWith('refresh-token-123');
      expect(res.json).toHaveBeenCalledWith({ success: true });
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should call next with error if logout fails', async () => {
      // Arrange
      const error = new Error('Logout failed');
      AuthService.logout.mockRejectedValue(error);
      
      // Act
      await AuthController.logout(req, res, next);
      
      // Assert
      expect(AuthService.logout).toHaveBeenCalledWith('refresh-token-123');
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });
  
  describe('refreshToken', () => {
    beforeEach(() => {
      req.body = {
        refreshToken: 'refresh-token-123'
      };
    });
    
    it('should refresh a token successfully', async () => {
      // Arrange
      const tokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      };
      AuthService.refreshToken.mockResolvedValue(tokens);
      
      // Act
      await AuthController.refreshToken(req, res, next);
      
      // Assert
      expect(AuthService.refreshToken).toHaveBeenCalledWith('refresh-token-123');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: tokens
      });
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should call next with error if refreshToken fails', async () => {
      // Arrange
      const error = new Error('Invalid refresh token');
      AuthService.refreshToken.mockRejectedValue(error);
      
      // Act
      await AuthController.refreshToken(req, res, next);
      
      // Assert
      expect(AuthService.refreshToken).toHaveBeenCalledWith('refresh-token-123');
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });
  
  describe('verifyEmail', () => {
    beforeEach(() => {
      req.body = {
        token: 'verification-token-123'
      };
    });
    
    it('should verify email successfully', async () => {
      // Arrange
      AuthService.verifyEmail.mockResolvedValue(true);
      
      // Act
      await AuthController.verifyEmail(req, res, next);
      
      // Assert
      expect(AuthService.verifyEmail).toHaveBeenCalledWith('verification-token-123');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Email verified successfully'
      });
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should call next with error if verification fails', async () => {
      // Arrange
      const error = new Error('Invalid verification token');
      AuthService.verifyEmail.mockRejectedValue(error);
      
      // Act
      await AuthController.verifyEmail(req, res, next);
      
      // Assert
      expect(AuthService.verifyEmail).toHaveBeenCalledWith('verification-token-123');
      expect(logger.error).toHaveBeenCalledWith('Email verification failed', { error: error.message });
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });
  
  describe('resendVerification', () => {
    beforeEach(() => {
      req.body = {
        email: 'test@example.com'
      };
    });
    
    it('should resend verification email successfully', async () => {
      // Arrange
      AuthService.resendVerificationEmail.mockResolvedValue(true);
      
      // Act
      await AuthController.resendVerification(req, res, next);
      
      // Assert
      expect(AuthService.resendVerificationEmail).toHaveBeenCalledWith('test@example.com');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Verification email sent successfully'
      });
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should call next with error if resend fails', async () => {
      // Arrange
      const error = new Error('Email not found');
      AuthService.resendVerificationEmail.mockRejectedValue(error);
      
      // Act
      await AuthController.resendVerification(req, res, next);
      
      // Assert
      expect(AuthService.resendVerificationEmail).toHaveBeenCalledWith('test@example.com');
      expect(logger.error).toHaveBeenCalledWith('Resend verification failed', { error: error.message, email: 'test@example.com' });
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });
}); 