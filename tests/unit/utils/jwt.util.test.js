const jwt = require('jsonwebtoken');
const jwtUtil = require('../../../src/utils/jwt.util');
const { jwt: jwtConfig } = require('../../../src/config/security');

// Mock jsonwebtoken
jest.mock('jsonwebtoken');

describe('JWT Utility', () => {
  const mockPayload = { id: '123', email: 'test@example.com' };
  const mockToken = 'mock.jwt.token';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('generateAccessToken', () => {
    it('should generate an access token with the correct parameters', async () => {
      // Mock implementation
      jwt.sign.mockImplementation((payload, secret, options, callback) => {
        callback(null, mockToken);
      });
      
      // Call the function
      const token = await jwtUtil.generateAccessToken(mockPayload);
      
      // Verify that jwt.sign was called with the correct parameters
      expect(jwt.sign).toHaveBeenCalledWith(
        { ...mockPayload, type: 'access' },
        jwtConfig.accessTokenSecret,
        expect.objectContaining({
          expiresIn: jwtConfig.accessTokenExpiry,
          issuer: jwtConfig.issuer,
          audience: jwtConfig.audience
        }),
        expect.any(Function)
      );
      
      // Verify the result
      expect(token).toBe(mockToken);
    });
    
    it('should handle errors during token generation', async () => {
      // Mock implementation with error
      jwt.sign.mockImplementation((payload, secret, options, callback) => {
        callback(new Error('Token generation failed'));
      });
      
      // Verify that the promise is rejected
      await expect(jwtUtil.generateAccessToken(mockPayload)).rejects.toThrow('Token generation failed');
    });
    
    it('should allow custom options', async () => {
      // Mock implementation
      jwt.sign.mockImplementation((payload, secret, options, callback) => {
        callback(null, mockToken);
      });
      
      // Custom options
      const customOptions = {
        expiresIn: '30m',
        audience: 'custom-audience'
      };
      
      // Call the function with custom options
      await jwtUtil.generateAccessToken(mockPayload, customOptions);
      
      // Verify that jwt.sign was called with custom options
      expect(jwt.sign).toHaveBeenCalledWith(
        { ...mockPayload, type: 'access' },
        jwtConfig.accessTokenSecret,
        expect.objectContaining(customOptions),
        expect.any(Function)
      );
    });
  });
  
  describe('generateRefreshToken', () => {
    it('should generate a refresh token with the correct parameters', async () => {
      // Mock implementation
      jwt.sign.mockImplementation((payload, secret, options, callback) => {
        callback(null, mockToken);
      });
      
      // Call the function
      const token = await jwtUtil.generateRefreshToken(mockPayload);
      
      // Verify that jwt.sign was called with the correct parameters
      expect(jwt.sign).toHaveBeenCalledWith(
        { ...mockPayload, type: 'refresh' },
        jwtConfig.refreshTokenSecret,
        expect.objectContaining({
          expiresIn: jwtConfig.refreshTokenExpiry,
          issuer: jwtConfig.issuer,
          audience: jwtConfig.audience
        }),
        expect.any(Function)
      );
      
      // Verify the result
      expect(token).toBe(mockToken);
    });
    
    it('should handle errors during token generation', async () => {
      // Mock implementation with error
      jwt.sign.mockImplementation((payload, secret, options, callback) => {
        callback(new Error('Token generation failed'));
      });
      
      // Verify that the promise is rejected
      await expect(jwtUtil.generateRefreshToken(mockPayload)).rejects.toThrow('Token generation failed');
    });
  });
  
  describe('verifyAccessToken', () => {
    it('should verify an access token successfully', async () => {
      // Mock decoded payload
      const decodedPayload = { ...mockPayload, type: 'access' };
      
      // Mock implementation
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, decodedPayload);
      });
      
      // Call the function
      const decoded = await jwtUtil.verifyAccessToken(mockToken);
      
      // Verify that jwt.verify was called with the correct parameters
      expect(jwt.verify).toHaveBeenCalledWith(
        mockToken,
        jwtConfig.accessTokenSecret,
        expect.any(Function)
      );
      
      // Verify the result
      expect(decoded).toEqual(decodedPayload);
    });
    
    it('should reject if verification fails', async () => {
      // Mock implementation with error
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(new Error('Invalid signature'));
      });
      
      // Verify that the promise is rejected
      await expect(jwtUtil.verifyAccessToken(mockToken)).rejects.toThrow('Invalid signature');
    });
    
    it('should reject if token type is not "access"', async () => {
      // Mock decoded payload with wrong type
      const decodedPayload = { ...mockPayload, type: 'refresh' };
      
      // Mock implementation
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, decodedPayload);
      });
      
      // Verify that the promise is rejected
      await expect(jwtUtil.verifyAccessToken(mockToken)).rejects.toThrow('Invalid token type');
    });
  });
  
  describe('verifyRefreshToken', () => {
    it('should verify a refresh token successfully', async () => {
      // Mock decoded payload
      const decodedPayload = { ...mockPayload, type: 'refresh' };
      
      // Mock implementation
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, decodedPayload);
      });
      
      // Call the function
      const decoded = await jwtUtil.verifyRefreshToken(mockToken);
      
      // Verify that jwt.verify was called with the correct parameters
      expect(jwt.verify).toHaveBeenCalledWith(
        mockToken,
        jwtConfig.refreshTokenSecret,
        expect.any(Function)
      );
      
      // Verify the result
      expect(decoded).toEqual(decodedPayload);
    });
    
    it('should reject if token type is not "refresh"', async () => {
      // Mock decoded payload with wrong type
      const decodedPayload = { ...mockPayload, type: 'access' };
      
      // Mock implementation
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, decodedPayload);
      });
      
      // Verify that the promise is rejected
      await expect(jwtUtil.verifyRefreshToken(mockToken)).rejects.toThrow('Invalid token type');
    });
  });
  
  describe('generatePurposeToken', () => {
    it('should generate a purpose token with the correct parameters', async () => {
      // Mock implementation
      jwt.sign.mockImplementation((payload, secret, options, callback) => {
        callback(null, mockToken);
      });
      
      // Call the function
      const token = await jwtUtil.generatePurposeToken(mockPayload, 'reset-password', '1h');
      
      // Verify that jwt.sign was called with the correct parameters
      expect(jwt.sign).toHaveBeenCalledWith(
        { ...mockPayload, type: 'reset-password' },
        jwtConfig.accessTokenSecret,
        expect.objectContaining({
          expiresIn: '1h',
          issuer: jwtConfig.issuer,
          audience: jwtConfig.audience
        }),
        expect.any(Function)
      );
      
      // Verify the result
      expect(token).toBe(mockToken);
    });
    
    it('should use default expiration if not provided', async () => {
      // Mock implementation
      jwt.sign.mockImplementation((payload, secret, options, callback) => {
        callback(null, mockToken);
      });
      
      // Call the function without expiration
      await jwtUtil.generatePurposeToken(mockPayload, 'verify-email');
      
      // Verify that jwt.sign was called with default expiration
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          expiresIn: '1d'
        }),
        expect.any(Function)
      );
    });
  });
  
  describe('verifyPurposeToken', () => {
    it('should verify a purpose token successfully', async () => {
      // Mock decoded payload
      const purpose = 'reset-password';
      const decodedPayload = { ...mockPayload, type: purpose };
      
      // Mock implementation
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, decodedPayload);
      });
      
      // Call the function
      const decoded = await jwtUtil.verifyPurposeToken(mockToken, purpose);
      
      // Verify that jwt.verify was called with the correct parameters
      expect(jwt.verify).toHaveBeenCalledWith(
        mockToken,
        jwtConfig.accessTokenSecret,
        expect.any(Function)
      );
      
      // Verify the result
      expect(decoded).toEqual(decodedPayload);
    });
    
    it('should reject if token purpose does not match', async () => {
      // Mock decoded payload with wrong type
      const decodedPayload = { ...mockPayload, type: 'reset-password' };
      
      // Mock implementation
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, decodedPayload);
      });
      
      // Verify that the promise is rejected
      await expect(jwtUtil.verifyPurposeToken(mockToken, 'verify-email')).rejects.toThrow('Invalid token type');
    });
  });
}); 