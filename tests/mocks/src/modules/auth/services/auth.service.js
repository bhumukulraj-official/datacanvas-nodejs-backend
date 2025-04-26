class AuthService {
  async register(userData, ip) {
    const User = require('src/modules/auth/models/User');
    const EmailVerificationToken = require('src/modules/auth/models/EmailVerificationToken');
    const bcrypt = require('bcryptjs');
    const { v4: uuidv4 } = require('uuid');

    // Check if email already exists
    const existingEmail = await User.findOne({
      where: { email: userData.email },
    });

    if (existingEmail) {
      const AppError = Error;
      throw new AppError('Email already exists');
    }

    // Check if username already exists
    const existingUsername = await User.findOne({
      where: { username: userData.username },
    });

    if (existingUsername) {
      const AppError = Error;
      throw new AppError('Username already exists');
    }

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

  async login(emailOrUsername, password, ip, userAgent) {
    const User = require('src/modules/auth/models/User');
    const bcrypt = require('bcryptjs');

    // Find user by email or username
    const user = await User.findOne({
      where: emailOrUsername.includes('@') 
        ? { email: emailOrUsername } 
        : { username: emailOrUsername },
    });

    if (!user) {
      const AppError = Error;
      throw new AppError('Invalid credentials');
    }

    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const waitTimeMinutes = Math.ceil(
        (new Date(user.locked_until) - new Date()) / (1000 * 60)
      );
      const AppError = Error;
      throw new AppError(
        `Account locked. Try again in ${waitTimeMinutes} minutes`
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
      const AppError = Error;
      throw new AppError(message);
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
      
      const AppError = Error;
      throw new AppError('Invalid credentials');
    }

    // Reset failed login attempts on successful login
    user.login_attempts = 0;
    user.locked_until = null;
    user.last_login = new Date();
    await user.save();

    // Generate JWT token
    const { token, expiresIn } = this.generateJwtToken(user, { ip, userAgent });
    
    // Generate refresh token
    const refreshToken = await this.generateRefreshToken(user.id, { ip, userAgent });

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

  async refreshToken() {}
  async logout() {}
  async logoutAll() {}
  async changePassword() {}
  
  generateJwtToken() {
    return {
      token: 'mock-jwt-token',
      expiresIn: 3600
    };
  }
  
  async generateRefreshToken() {
    return {
      id: 1,
      token: 'mock-refresh-token',
      user_id: 1,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    };
  }
  
  validatePasswordStrength() {}
}

module.exports = AuthService; 