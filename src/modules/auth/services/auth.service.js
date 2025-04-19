const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const EmailVerificationToken = require('../models/EmailVerificationToken');
const { AppError } = require('../../../shared/errors');

class AuthService {
  /**
   * Register a new user
   * @param {Object} userData - User data for registration
   * @param {string} ip - IP address of the request
   * @returns {Object} Created user object (without password)
   */
  async register(userData, ip) {
    // Check if email already exists
    const existingUser = await User.findOne({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new AppError('Email already exists', 400, 'AUTH_005');
    }

    // Validate password format
    this.validatePasswordStrength(userData.password);

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(userData.password, salt);

    // Create user
    const user = await User.create({
      email: userData.email,
      password_hash: passwordHash,
      name: userData.name,
      role: userData.role || 'user',
      password_history: [passwordHash], // Add current password to history
      last_login_ip: ip,
    });

    // Generate email verification token
    const verificationToken = uuidv4();
    await EmailVerificationToken.create({
      user_id: user.id,
      token: verificationToken
    });

    // Return user without password
    const userObj = user.toJSON();
    delete userObj.password_hash;
    delete userObj.password_history;
    
    // In a real application, you would send an email here with the verification link
    // For development purposes, include the token in the response
    if (process.env.NODE_ENV === 'development') {
      userObj.verification_token = verificationToken;
    }
    
    return userObj;
  }

  /**
   * Login a user
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} ip - IP address of the request
   * @param {string} userAgent - User agent string
   * @param {Object} deviceInfo - Device information
   * @returns {Object} User object with tokens
   */
  async login(email, password, ip, userAgent, deviceInfo = {}) {
    // Find user
    const user = await User.findOne({
      where: { email },
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

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      // Increment failed login attempts
      user.failed_login_attempts += 1;
      
      // Lock account after 5 failed attempts
      if (user.failed_login_attempts >= 5) {
        const lockoutDuration = 15 * 60 * 1000; // 15 minutes in milliseconds
        user.locked_until = new Date(Date.now() + lockoutDuration);
      }
      
      await user.save();
      
      throw new AppError('Invalid credentials', 401, 'AUTH_001');
    }

    // Reset failed login attempts on successful login
    user.failed_login_attempts = 0;
    user.locked_until = null;
    user.last_login_at = new Date();
    user.last_login_ip = ip;

    // Check if we need to enforce maximum concurrent sessions
    if (user.active_sessions && user.active_sessions.length >= 5) {
      // Remove oldest session
      user.active_sessions.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      const oldestSession = user.active_sessions.shift();
      
      // Revoke the corresponding refresh token
      if (oldestSession.token_id) {
        await RefreshToken.update(
          { is_revoked: true },
          { where: { id: oldestSession.token_id } }
        );
      }
    }

    // Generate JWT token
    const { token, expiresIn } = this.generateJwtToken(user);
    
    // Generate refresh token
    const refreshToken = await this.generateRefreshToken(
      user.id,
      ip,
      userAgent,
      deviceInfo
    );

    // Add session to active sessions
    const sessionId = uuidv4();
    const session = {
      id: sessionId,
      token_id: refreshToken.id,
      ip_address: ip,
      user_agent: userAgent,
      device_info: deviceInfo,
      created_at: new Date(),
    };

    if (!user.active_sessions) {
      user.active_sessions = [];
    }
    
    user.active_sessions.push(session);
    await user.save();

    // Return user object with tokens
    const userObj = user.toJSON();
    delete userObj.password_hash;
    delete userObj.password_history;

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
   * @param {string} ip - IP address of the request
   * @param {string} userAgent - User agent string
   * @returns {Object} New JWT token pair
   */
  async refreshToken(refreshTokenString, ip, userAgent) {
    // Find refresh token
    const refreshTokenObj = await RefreshToken.findOne({
      where: { token: refreshTokenString, is_revoked: false },
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
      throw new AppError('User not found', 404, 'NOT_001');
    }

    // Generate new JWT token
    const { token, expiresIn } = this.generateJwtToken(user);

    // Update refresh token
    refreshTokenObj.ip_address = ip;
    refreshTokenObj.user_agent = userAgent;
    refreshTokenObj.expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await refreshTokenObj.save();

    return {
      token,
      refreshToken: refreshTokenObj.token,
      expiresIn,
      tokenType: 'Bearer',
    };
  }

  /**
   * Logout user by invalidating refresh token
   * @param {number} userId - User ID
   * @param {string} refreshToken - Refresh token to invalidate
   * @returns {boolean} Success status
   */
  async logout(userId, refreshToken) {
    // Find refresh token
    const refreshTokenObj = await RefreshToken.findOne({
      where: { token: refreshToken, user_id: userId },
    });

    if (!refreshTokenObj) {
      return true; // Token already invalid or doesn't exist
    }

    // Mark token as revoked
    refreshTokenObj.is_revoked = true;
    await refreshTokenObj.save();

    // Remove session from active sessions
    const user = await User.findByPk(userId);
    if (user && user.active_sessions) {
      user.active_sessions = user.active_sessions.filter(
        (session) => session.token_id !== refreshTokenObj.id
      );
      await user.save();
    }

    return true;
  }

  /**
   * Logout user from all devices
   * @param {number} userId - User ID
   * @returns {boolean} Success status
   */
  async logoutAll(userId) {
    // Revoke all refresh tokens for user
    await RefreshToken.update(
      { is_revoked: true },
      { where: { user_id: userId, is_revoked: false } }
    );

    // Clear active sessions
    const user = await User.findByPk(userId);
    if (user) {
      user.active_sessions = [];
      await user.save();
    }

    return true;
  }

  /**
   * Change user password
   * @param {number} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {boolean} Success status
   */
  async changePassword(userId, currentPassword, newPassword) {
    // Find user
    const user = await User.findByPk(userId);

    if (!user) {
      throw new AppError('User not found', 404, 'NOT_001');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isPasswordValid) {
      throw new AppError('Invalid current password', 401, 'AUTH_001');
    }

    // Validate new password
    this.validatePasswordStrength(newPassword);
    this.validatePasswordHistory(newPassword, user.password_history);

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // Update password history
    let passwordHistory = user.password_history || [];
    passwordHistory.unshift(newPasswordHash);
    // Keep only last 5 passwords
    if (passwordHistory.length > 5) {
      passwordHistory = passwordHistory.slice(0, 5);
    }

    // Update user
    user.password_hash = newPasswordHash;
    user.password_history = passwordHistory;
    user.password_updated_at = new Date();
    await user.save();

    // Logout from all devices except current one
    await this.logoutAll(userId);

    return true;
  }

  /**
   * Generate JWT token
   * @param {Object} user - User object
   * @returns {Object} Token and expiration
   */
  generateJwtToken(user) {
    const expiresIn = 60 * 30; // 30 minutes in seconds

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn,
    });

    return { token, expiresIn };
  }

  /**
   * Generate refresh token
   * @param {number} userId - User ID
   * @param {string} ip - IP address of the request
   * @param {string} userAgent - User agent string
   * @param {Object} deviceInfo - Device information
   * @returns {Object} Refresh token object
   */
  async generateRefreshToken(userId, ip, userAgent, deviceInfo = {}) {
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create refresh token
    const refreshToken = await RefreshToken.create({
      user_id: userId,
      token,
      expires_at: expiresAt,
      ip_address: ip,
      user_agent: userAgent,
      device_info: deviceInfo,
    });

    return refreshToken;
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @throws {AppError} If password is invalid
   */
  validatePasswordStrength(password) {
    // Check length
    if (password.length < 8) {
      throw new AppError(
        'Password must be at least 8 characters long',
        400,
        'AUTH_006'
      );
    }

    // Check for uppercase letter
    if (!/[A-Z]/.test(password)) {
      throw new AppError(
        'Password must contain at least one uppercase letter',
        400,
        'AUTH_006'
      );
    }

    // Check for lowercase letter
    if (!/[a-z]/.test(password)) {
      throw new AppError(
        'Password must contain at least one lowercase letter',
        400,
        'AUTH_006'
      );
    }

    // Check for number
    if (!/\d/.test(password)) {
      throw new AppError(
        'Password must contain at least one number',
        400,
        'AUTH_006'
      );
    }

    // Check for special character
    if (!/[\W_]/.test(password)) {
      throw new AppError(
        'Password must contain at least one special character',
        400,
        'AUTH_006'
      );
    }
  }

  /**
   * Validate password against history
   * @param {string} newPassword - New password to validate
   * @param {Array} passwordHistory - Array of password hashes
   * @throws {AppError} If password is in history
   */
  async validatePasswordHistory(newPassword, passwordHistory) {
    if (!passwordHistory || !Array.isArray(passwordHistory)) {
      return;
    }

    // Check if new password matches any of the previous 5 passwords
    for (const passwordHash of passwordHistory) {
      const isMatch = await bcrypt.compare(newPassword, passwordHash);
      if (isMatch) {
        throw new AppError(
          'New password cannot be the same as any of your previous 5 passwords',
          400,
          'AUTH_015'
        );
      }
    }
  }
}

module.exports = new AuthService(); 