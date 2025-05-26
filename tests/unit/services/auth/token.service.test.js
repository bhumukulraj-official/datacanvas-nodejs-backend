const tokenService = require('../../../../src/services/auth/token.service');
const RefreshTokenRepository = require('../../../../src/data/repositories/auth/RefreshTokenRepository');
const jwtUtil = require('../../../../src/utils/jwt.util');
const { redis } = require('../../../../src/config');

// Mock the repository
jest.mock('../../../../src/data/repositories/auth/RefreshTokenRepository');

// Mock the JWT utility
jest.mock('../../../../src/utils/jwt.util', () => ({
  verifyAccessToken: jest.fn()
}));

// Mock Redis
jest.mock('../../../../src/config', () => ({
  redis: {
    set: jest.fn(),
    exists: jest.fn()
  }
}));

describe('TokenService', () => {
  let mockRefreshTokenRepository;
  
  beforeEach(() => {
    // Create new instance of mocked repository
    mockRefreshTokenRepository = new RefreshTokenRepository();
    
    // Reset mock implementations
    jest.clearAllMocks();
    
    // Mock repository on the service
    tokenService.refreshTokenRepo = mockRefreshTokenRepository;
  });

  describe('revokeToken', () => {
    test('should revoke an access token successfully', async () => {
      const token = 'access_token_123';
      
      // Mock JWT verification result
      const decodedToken = {
        id: 1,
        email: 'user@example.com',
        exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour in the future
      };
      
      jwtUtil.verifyAccessToken.mockResolvedValue(decodedToken);
      
      // Mock Redis set
      redis.set.mockResolvedValue('OK');
      
      // Call the service method
      const result = await tokenService.revokeToken(token);
      
      // Assertions
      expect(jwtUtil.verifyAccessToken).toHaveBeenCalledWith(token);
      
      // Calculate TTL (should be close to 3600)
      const ttl = Math.floor((decodedToken.exp * 1000 - Date.now()) / 1000);
      expect(ttl).toBeGreaterThan(3500); // Allow some flexibility in timing
      
      expect(redis.set).toHaveBeenCalledWith(
        `blacklist:${token}`,
        'true',
        'EX',
        expect.any(Number)
      );
      expect(result).toBe(true);
    });
  });

  describe('isTokenRevoked', () => {
    test('should return true for revoked token', async () => {
      const token = 'revoked_token_123';
      
      // Mock Redis exists to return 1 (token exists in blacklist)
      redis.exists.mockResolvedValue(1);
      
      // Call the service method
      const result = await tokenService.isTokenRevoked(token);
      
      // Assertions
      expect(redis.exists).toHaveBeenCalledWith(`blacklist:${token}`);
      expect(result).toBe(1);
    });
    
    test('should return false for valid token', async () => {
      const token = 'valid_token_123';
      
      // Mock Redis exists to return 0 (token does not exist in blacklist)
      redis.exists.mockResolvedValue(0);
      
      // Call the service method
      const result = await tokenService.isTokenRevoked(token);
      
      // Assertions
      expect(redis.exists).toHaveBeenCalledWith(`blacklist:${token}`);
      expect(result).toBe(0);
    });
  });

  describe('revokeAllTokensForUser', () => {
    test('should revoke all refresh tokens for a user', async () => {
      const userId = 1;
      
      // Mock repository call
      mockRefreshTokenRepository.revokeAllForUser = jest.fn().mockResolvedValue(5); // 5 tokens revoked
      
      // Call the service method
      const result = await tokenService.revokeAllTokensForUser(userId);
      
      // Assertions
      expect(mockRefreshTokenRepository.revokeAllForUser).toHaveBeenCalledWith(userId);
      expect(result).toBe(true);
    });
  });
}); 