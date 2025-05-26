const httpMocks = require('node-mocks-http');
const { UnauthorizedError, InvalidTokenError, TokenExpiredError, ResourceNotFoundError } = require('../../../src/utils/error.util');

// Create mock functions
const mockGetWithRoles = jest.fn();

// Mock the repositories/auth index
jest.mock('../../../src/data/repositories/auth', () => ({
  UserRepository: jest.fn().mockImplementation(() => ({
    getWithRoles: mockGetWithRoles
  }))
}));

// Mock the token service
jest.mock('../../../src/services/auth', () => ({
  TokenService: {
    isTokenRevoked: jest.fn()
  }
}));

// Mock JWT util
jest.mock('../../../src/utils/jwt.util', () => ({
  verifyAccessToken: jest.fn()
}));

// Import the middleware after the mocks
const { authenticate, authorize } = require('../../../src/api/middlewares/auth.middleware');
const { UserRepository } = require('../../../src/data/repositories/auth');
const { TokenService } = require('../../../src/services/auth');
const jwtUtil = require('../../../src/utils/jwt.util');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = httpMocks.createRequest();
    res = httpMocks.createResponse();
    next = jest.fn();
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should pass when valid token is provided', async () => {
      // Arrange
      req.headers = {
        authorization: 'Bearer valid_token'
      };
      
      // The token payload should include id
      jwtUtil.verifyAccessToken.mockResolvedValue({ id: '1' });
      TokenService.isTokenRevoked.mockResolvedValue(false);
      mockGetWithRoles.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        UserRoles: [{ role: 'admin' }]
      });

      // Act
      await authenticate(req, res, next);

      // Assert
      expect(jwtUtil.verifyAccessToken).toHaveBeenCalledWith('valid_token');
      expect(mockGetWithRoles).toHaveBeenCalledWith('1');
      expect(req.user).toEqual({
        id: '1',
        email: 'test@example.com',
        role: 'admin'
      });
      expect(next).toHaveBeenCalled();
    });

    it('should throw error when authorization header is missing', async () => {
      // Act
      await authenticate(req, res, next);

      // Assert
      expect(res.statusCode).toBe(401);
      expect(res._getJSONData()).toEqual(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'AUTH_003',
            message: 'Authentication required'
          })
        })
      );
    });

    it('should throw error when authorization header is not Bearer', async () => {
      // Arrange
      req.headers = {
        authorization: 'Basic token'
      };

      // Act
      await authenticate(req, res, next);

      // Assert
      expect(res.statusCode).toBe(401);
      expect(res._getJSONData()).toEqual(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'AUTH_003',
            message: 'Authentication required'
          })
        })
      );
    });

    it('should throw error when token verification fails', async () => {
      // Arrange
      req.headers = {
        authorization: 'Bearer invalid_token'
      };
      
      jwtUtil.verifyAccessToken.mockRejectedValue(new InvalidTokenError('Invalid token'));

      // Act
      await authenticate(req, res, next);

      // Assert
      expect(res.statusCode).toBe(401);
      expect(res._getJSONData()).toEqual(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'AUTH_003',
            message: 'Invalid token'
          })
        })
      );
    });

    it('should throw error when user is not found', async () => {
      // Arrange
      req.headers = {
        authorization: 'Bearer valid_token'
      };
      
      jwtUtil.verifyAccessToken.mockResolvedValue({ id: '1' });
      TokenService.isTokenRevoked.mockResolvedValue(false);
      mockGetWithRoles.mockResolvedValue(null);

      // Act
      await authenticate(req, res, next);

      // Assert
      expect(jwtUtil.verifyAccessToken).toHaveBeenCalledWith('valid_token');
      expect(mockGetWithRoles).toHaveBeenCalledWith('1');
      expect(res.statusCode).toBe(401);
      expect(res._getJSONData()).toEqual(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'AUTH_003',
            message: 'User not found'
          })
        })
      );
    });

    it('should throw error when token is expired', async () => {
      // Arrange
      req.headers = {
        authorization: 'Bearer expired_token'
      };
      
      const error = new TokenExpiredError('Token expired');
      error.name = 'TokenExpiredError';
      jwtUtil.verifyAccessToken.mockRejectedValue(error);

      // Act
      await authenticate(req, res, next);

      // Assert
      expect(res.statusCode).toBe(401);
      expect(res._getJSONData()).toEqual(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'AUTH_002',
            message: 'Token expired'
          })
        })
      );
    });

    it('should throw error when token is revoked', async () => {
      // Arrange
      req.headers = {
        authorization: 'Bearer revoked_token'
      };
      
      TokenService.isTokenRevoked.mockResolvedValue(true);

      // Act
      await authenticate(req, res, next);

      // Assert
      expect(TokenService.isTokenRevoked).toHaveBeenCalledWith('revoked_token');
      expect(res.statusCode).toBe(401);
      expect(res._getJSONData()).toEqual(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'AUTH_003',
            message: 'Token has been revoked'
          })
        })
      );
    });
  });

  describe('authorize', () => {
    it('should pass when no roles are required', async () => {
      // Arrange
      req.user = {
        id: '1',
        email: 'test@example.com',
        role: 'user'
      };
      
      const middleware = authorize([]);

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
    });

    it('should pass when user has required role', async () => {
      // Arrange
      req.user = {
        id: '1',
        email: 'test@example.com',
        role: 'admin'
      };
      
      const middleware = authorize(['admin']);

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
    });

    it('should pass when user has one of required roles', async () => {
      // Arrange
      req.user = {
        id: '1',
        email: 'test@example.com',
        role: 'editor'
      };
      
      const middleware = authorize(['admin', 'editor']);

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
    });

    it('should throw error when user does not have required role', async () => {
      // Arrange
      req.user = {
        id: '1',
        email: 'test@example.com',
        role: 'user'
      };
      
      const middleware = authorize(['admin']);

      // Act
      middleware(req, res, next);

      // Assert
      expect(res.statusCode).toBe(403);
      expect(res._getJSONData()).toEqual(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'PERM_001',
            message: 'Permission denied'
          })
        })
      );
    });

    it('should throw error when user is not authenticated', async () => {
      // Arrange
      req.user = null;
      
      const middleware = authorize(['admin']);

      // Act
      middleware(req, res, next);

      // Assert
      expect(res.statusCode).toBe(403);
      expect(res._getJSONData()).toEqual(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'PERM_001',
            message: 'Permission denied'
          })
        })
      );
    });
  });
}); 