const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { constants, passwordPolicy } = require('../config/security');

/**
 * Password Utility Functions
 */
const passwordUtil = {
  /**
   * Hash a password
   * @param {string} password - Raw password to hash
   * @param {number} saltRounds - Number of salt rounds (default from config)
   * @returns {Promise<string>} Hashed password
   */
  hashPassword: async (password, saltRounds = constants.BCRYPT_SALT_ROUNDS) => {
    return await bcrypt.hash(password, saltRounds);
  },

  /**
   * Compare a password with its hash
   * @param {string} password - Raw password to compare
   * @param {string} hash - Hashed password to compare against
   * @returns {Promise<boolean>} Whether the password matches the hash
   */
  verifyPassword: async (password, hash) => {
    return await bcrypt.compare(password, hash);
  },

  /**
   * Generate a random token
   * @param {number} length - Length of the token in bytes
   * @returns {string} Random token as a hex string
   */
  generateRandomToken: (length = 32) => {
    return crypto.randomBytes(length).toString('hex');
  },

  /**
   * Generate a secure API key
   * @returns {string} API key
   */
  generateApiKey: () => {
    return `pk_${crypto.randomBytes(16).toString('hex')}_${Date.now().toString(36)}`;
  },

  /**
   * Hash an API key for storage
   * @param {string} apiKey - API key to hash
   * @returns {string} SHA-256 hash of the API key
   */
  hashApiKey: (apiKey) => {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
  },

  /**
   * Validate a password against password policy
   * @param {string} password - Password to validate
   * @returns {Object} Validation result with success and error message
   */
  validatePasswordStrength: (password) => {
    const result = {
      success: true,
      errors: [],
    };

    // Check length
    if (password.length < passwordPolicy.minLength) {
      result.success = false;
      result.errors.push(`Password must be at least ${passwordPolicy.minLength} characters long`);
    }

    // Check for uppercase letters
    if (passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) {
      result.success = false;
      result.errors.push('Password must contain at least one uppercase letter');
    }

    // Check for lowercase letters
    if (passwordPolicy.requireLowercase && !/[a-z]/.test(password)) {
      result.success = false;
      result.errors.push('Password must contain at least one lowercase letter');
    }

    // Check for numbers
    if (passwordPolicy.requireNumbers && !/[0-9]/.test(password)) {
      result.success = false;
      result.errors.push('Password must contain at least one number');
    }

    // Check for symbols
    if (passwordPolicy.requireSymbols && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      result.success = false;
      result.errors.push('Password must contain at least one special character');
    }

    return result;
  },

  /**
   * Generate a secure password that meets the password policy requirements
   * @returns {string} Generated password
   */
  generateSecurePassword: () => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let password = '';
    
    // Ensure we include at least one character from each required category
    if (passwordPolicy.requireUppercase) {
      password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    }

    if (passwordPolicy.requireLowercase) {
      password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    }

    if (passwordPolicy.requireNumbers) {
      password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }

    if (passwordPolicy.requireSymbols) {
      password += symbols.charAt(Math.floor(Math.random() * symbols.length));
    }

    // Add remaining characters to meet minimum length
    const allChars = [
      ...(passwordPolicy.requireUppercase ? uppercase.split('') : []),
      ...(passwordPolicy.requireLowercase ? lowercase.split('') : []),
      ...(passwordPolicy.requireNumbers ? numbers.split('') : []),
      ...(passwordPolicy.requireSymbols ? symbols.split('') : []),
    ];

    while (password.length < passwordPolicy.minLength) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password to avoid predictable patterns
    return password.split('').sort(() => 0.5 - Math.random()).join('');
  },
};

module.exports = passwordUtil; 