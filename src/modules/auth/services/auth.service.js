const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const EmailVerificationToken = require('../models/EmailVerificationToken');
const { AppError } = require('../../../shared/errors');
const config = require('../../../shared/config');

class AuthService {
  /**
   * Register a new user
   * @param {Object} userData - User data for registration
   * @param {string} ip - IP address of the request
   * @returns {Object} Created user object (without password)
   */
  async register(userData, ip) {
    // Check if email already exists
    const existingEmail = await User.findOne({
      where: { email: userData.email },
    });

    if (existingEmail) {
      throw new AppError('Email already exists', 400, 'AUTH_005');
    }

    // Check if username already exists
    const existingUsername = await User.findOne({
      where: { username: userData.username },
    });

    if (existingUsername) {
      throw new AppError('Username already exists', 400, 'AUTH_006');
    }

    // Validate password format
    this.validatePasswordStrength(userData.password);

    // Generate salt and hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    // Create user
    const user = await User.create({
      username: userData.username,
      email: userData.email,
      password: hashedPassword,
      password_salt: salt,
      first_name: userData.first_name || null,
      last_name: userData.last_name || null,
      role: userData.role || 'user',
      status: 'active',
      is_email_verified: false,
    });

    // Generate email verification token
    const verificationToken = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    
    await EmailVerificationToken.create({
      user_id: user.id,
      token: verificationToken,
      expires_at: expiresAt
    });

    // Return user without password
    const userObj = user.toJSON();
    delete userObj.password;
    delete userObj.password_salt;
    
    // In a real application, you would send an email here with the verification link
    // For development purposes, include the token in the response
    if (process.env.NODE_ENV === 'development') {
      userObj.verification_token = verificationToken;
    }
    
    return userObj;
  }

  /**
   * Login a user
   * @param {string} email - User email or username
   * @param {string} password - User password
   * @param {string} ip - IP address of the request
   * @param {string} userAgent - User agent string
   * @returns {Object} User object with tokens
   */
  async login(emailOrUsername, password, ip, userAgent) {
    // Find user by email or username
    const user = await User.findOne({
      where: emailOrUsername.includes('@') 
        ? { email: emailOrUsername } 
        : { username: emailOrUsername },
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401, 'AUTH_001');
    }

    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const waitTimeMinutes = Math.ceil(
        (new Date(user.locked_until) - new Date()) / (1000 * 60)
      );
      throw new AppError(
        `Account locked. Try again in ${waitTimeMinutes} minutes`,
        401,
        'AUTH_014'
      );
    }

    // Check account status
    if (user.status !== 'active') {
      const statusMessages = {
        'inactive': 'Account is inactive. Please contact support.',
        'suspended': 'Account is temporarily suspended. Please contact support.',
        'banned': 'Account has been banned. Please contact support.'
      };
      
      const message = statusMessages[user.status] || `Account is ${user.status}. Please contact support.`;
      throw new AppError(message, 401, 'AUTH_015');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // Increment failed login attempts
      user.login_attempts += 1;
      
      // Lock account after 5 failed attempts
      if (user.login_attempts >= 5) {
        const lockoutDuration = 15 * 60 * 1000; // 15 minutes in milliseconds
        user.locked_until = new Date(Date.now() + lockoutDuration);
      }
      
      await user.save();
      
      throw new AppError('Invalid credentials', 401, 'AUTH_001');
    }

    // Reset failed login attempts on successful login
    user.login_attempts = 0;
    user.locked_until = null;
    user.last_login = new Date();
    await user.save();

    // Generate JWT token
    const { token, expiresIn } = this.generateJwtToken(user);
    
    // Generate refresh token
    const refreshToken = await this.generateRefreshToken(user.id);

    // Return user object with tokens
    const userObj = user.toJSON();
    delete userObj.password;
    delete userObj.password_salt;

    return {
      user: userObj,
      token,
      refreshToken: refreshToken.token,
      expiresIn,
      tokenType: 'Bearer',
    };
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshTokenString - Refresh token string
   * @returns {Object} New JWT token pair
   */
  async refreshToken(refreshTokenString) {
    // Find refresh token
    const refreshTokenObj = await RefreshToken.findOne({
      where: { token: refreshTokenString },
    });

    if (!refreshTokenObj) {
      throw new AppError('Invalid token', 401, 'AUTH_003');
    }

    // Check if token is expired
    if (new Date(refreshTokenObj.expires_at) < new Date()) {
      throw new AppError('Refresh token expired', 401, 'AUTH_004');
    }

    // Find user
    const user = await User.findByPk(refreshTokenObj.user_id);

    if (!user) {
      throw new AppError('User not found', 404, 'AUTH_002');
    }

    // Check account status
    if (user.status !== 'active') {
      const statusMessages = {
        'inactive': 'Account is inactive. Please contact support.',
        'suspended': 'Account is temporarily suspended. Please contact support.',
        'banned': 'Account has been banned. Please contact support.'
      };
      
      const message = statusMessages[user.status] || `Account is ${user.status}. Please contact support.`;
      throw new AppError(message, 401, 'AUTH_016');
    }

    // Generate new JWT token
    const { token, expiresIn } = this.generateJwtToken(user);

    return {
      token,
      expiresIn,
      tokenType: 'Bearer',
    };
  }

  /**
   * Logout a user
   * @param {number} userId - User ID
   * @param {string} refreshToken - Refresh token to invalidate
   */
  async logout(userId, refreshToken) {
    // Delete the specific refresh token
    const tokenRecord = await RefreshToken.findOne({
      where: {
        user_id: userId,
        token: refreshToken,
      },
    });

    if (tokenRecord) {
      await tokenRecord.destroy();
    }
  }

  /**
   * Logout from all devices
   * @param {number} userId - User ID
   */
  async logoutAll(userId) {
    // Delete all refresh tokens for the user
    await RefreshToken.destroy({
      where: {
        user_id: userId,
      },
    });
  }

  /**
   * Change user password
   * @param {number} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   */
  async changePassword(userId, currentPassword, newPassword) {
    // Find user
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'AUTH_002');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new AppError('Current password is incorrect', 400, 'AUTH_007');
    }

    // Check if new password is the same as current
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new AppError('New password must be different from current password', 400, 'AUTH_008');
    }

    // Validate new password
    this.validatePasswordStrength(newPassword);

    // Generate new salt and hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user password
    user.password = hashedPassword;
    user.password_salt = salt;
    await user.save();

    // Logout from all devices except current one
    await this.logoutAll(userId);
  }

  /**
   * Generate JWT token
   * @param {Object} user - User object
   * @returns {Object} JWT token and expiration
   */
  generateJwtToken(user) {
    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
    };

    const expiresIn = config.jwt.expiresIn || '1h';
    const token = jwt.sign(payload, config.jwt.secret, {
      expiresIn,
    });

    return {
      token,
      expiresIn,
    };
  }

  /**
   * Generate refresh token
   * @param {number} userId - User ID
   * @returns {Object} Refresh token object
   */
  async generateRefreshToken(userId) {
    const tokenValue = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now

    const refreshToken = await RefreshToken.create({
      user_id: userId,
      token: tokenValue,
      expires_at: expiresAt,
    });

    return refreshToken;
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @throws {AppError} If password doesn't meet requirements
   */
  validatePasswordStrength(password) {
    if (!password || password.length < 8) {
      throw new AppError('Password must be at least 8 characters long', 400, 'AUTH_009');
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      throw new AppError('Password must contain at least one uppercase letter', 400, 'AUTH_010');
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      throw new AppError('Password must contain at least one lowercase letter', 400, 'AUTH_011');
    }

    // Check for at least one number
    if (!/[0-9]/.test(password)) {
      throw new AppError('Password must contain at least one number', 400, 'AUTH_012');
    }

    // Check for at least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      throw new AppError('Password must contain at least one special character', 400, 'AUTH_013');
    }
  }
}

module.exports = new AuthService(); 