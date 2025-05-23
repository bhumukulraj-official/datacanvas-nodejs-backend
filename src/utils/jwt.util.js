const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../config/security');

/**
 * JWT Utility Functions
 */
const jwtUtil = {
  /**
   * Generate an access token
   * @param {Object} payload - Token payload
   * @param {Object} options - Additional options
   * @returns {Promise<string>} Generated token
   */
  generateAccessToken: (payload, options = {}) => {
    return new Promise((resolve, reject) => {
      const tokenOptions = {
        expiresIn: jwtConfig.accessTokenExpiry,
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
        ...options,
      };

      jwt.sign(
        { ...payload, type: 'access' },
        jwtConfig.accessTokenSecret,
        tokenOptions,
        (err, token) => {
          if (err) {
            return reject(err);
          }
          resolve(token);
        }
      );
    });
  },

  /**
   * Generate a refresh token
   * @param {Object} payload - Token payload
   * @param {Object} options - Additional options
   * @returns {Promise<string>} Generated token
   */
  generateRefreshToken: (payload, options = {}) => {
    return new Promise((resolve, reject) => {
      const tokenOptions = {
        expiresIn: jwtConfig.refreshTokenExpiry,
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
        ...options,
      };

      jwt.sign(
        { ...payload, type: 'refresh' },
        jwtConfig.refreshTokenSecret,
        tokenOptions,
        (err, token) => {
          if (err) {
            return reject(err);
          }
          resolve(token);
        }
      );
    });
  },

  /**
   * Verify an access token
   * @param {string} token - The JWT token to verify
   * @returns {Promise<Object>} Decoded token payload
   */
  verifyAccessToken: (token) => {
    return new Promise((resolve, reject) => {
      jwt.verify(token, jwtConfig.accessTokenSecret, (err, decoded) => {
        if (err) {
          return reject(err);
        }
        
        if (decoded.type !== 'access') {
          return reject(new Error('Invalid token type'));
        }
        
        resolve(decoded);
      });
    });
  },

  /**
   * Verify a refresh token
   * @param {string} token - The JWT token to verify
   * @returns {Promise<Object>} Decoded token payload
   */
  verifyRefreshToken: (token) => {
    return new Promise((resolve, reject) => {
      jwt.verify(token, jwtConfig.refreshTokenSecret, (err, decoded) => {
        if (err) {
          return reject(err);
        }
        
        if (decoded.type !== 'refresh') {
          return reject(new Error('Invalid token type'));
        }
        
        resolve(decoded);
      });
    });
  },

  /**
   * Generate a token for a specific purpose (email verification, password reset, etc.)
   * @param {Object} payload - Token payload
   * @param {string} purpose - Token purpose
   * @param {string} expiresIn - Token expiration time
   * @returns {Promise<string>} Generated token
   */
  generatePurposeToken: (payload, purpose, expiresIn = '1d') => {
    return new Promise((resolve, reject) => {
      const tokenOptions = {
        expiresIn,
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
      };

      jwt.sign(
        { ...payload, type: purpose },
        jwtConfig.accessTokenSecret,
        tokenOptions,
        (err, token) => {
          if (err) {
            return reject(err);
          }
          resolve(token);
        }
      );
    });
  },

  /**
   * Verify a purpose token
   * @param {string} token - The JWT token to verify
   * @param {string} purpose - Expected token purpose
   * @returns {Promise<Object>} Decoded token payload
   */
  verifyPurposeToken: (token, purpose) => {
    return new Promise((resolve, reject) => {
      jwt.verify(token, jwtConfig.accessTokenSecret, (err, decoded) => {
        if (err) {
          return reject(err);
        }
        
        if (decoded.type !== purpose) {
          return reject(new Error('Invalid token type'));
        }
        
        resolve(decoded);
      });
    });
  },
};

module.exports = jwtUtil; 