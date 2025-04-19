const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const PasswordResetToken = require('../models/PasswordResetToken');
const { AppResponse } = require('../../../shared/utils/appResponse');
const { AppError } = require('../../../shared/errors');
const authService = require('../services/auth.service');

/**
 * Request password reset
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    // Find user by email
    const user = await User.findOne({
      where: { email }
    });
    
    if (!user) {
      throw new AppError('Email not found', 404, 'AUTH_011');
    }
    
    // Rate limiting (in a real implementation, you would use Redis for this)
    // For now, we'll just check for existing tokens to prevent abuse
    const existingTokens = await PasswordResetToken.count({
      where: { user_id: user.id }
    });
    
    if (existingTokens >= 3) {
      throw new AppError('Too many reset requests. Please try again later.', 429, 'RATE_002');
    }
    
    // Delete any existing expired tokens for this user
    const now = new Date();
    await PasswordResetToken.destroy({
      where: { 
        user_id: user.id,
        created_at: { $lt: new Date(now - 60 * 60 * 1000) } // Older than 1 hour
      }
    });
    
    // Create new reset token
    const token = uuidv4();
    await PasswordResetToken.create({
      user_id: user.id,
      token
    });
    
    // In a real application, you would send an email here with the reset link
    // For this implementation, we'll just return the token in the response
    // This is for testing purposes only
    
    return AppResponse.success(res, 
      { token: process.env.NODE_ENV === 'development' ? token : undefined }, 
      'Password reset instructions sent to your email'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Confirm password reset
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.confirmPasswordReset = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    
    // Find reset token
    const resetToken = await PasswordResetToken.findOne({
      where: { token }
    });
    
    if (!resetToken) {
      throw new AppError('Invalid reset token', 400, 'AUTH_012');
    }
    
    // Check if token is expired (1 hour)
    const now = new Date();
    const tokenCreatedAt = new Date(resetToken.created_at);
    const tokenExpiration = new Date(tokenCreatedAt.getTime() + 60 * 60 * 1000);
    
    if (now > tokenExpiration) {
      throw new AppError('Token expired', 400, 'AUTH_013');
    }
    
    // Find user
    const user = await User.findByPk(resetToken.user_id);
    
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_001');
    }
    
    // Validate password format and history
    authService.validatePasswordStrength(newPassword);
    await authService.validatePasswordHistory(newPassword, user.password_history);
    
    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    
    // Update password history
    let passwordHistory = user.password_history || [];
    passwordHistory.unshift(passwordHash);
    
    // Keep only last 5 passwords
    if (passwordHistory.length > 5) {
      passwordHistory = passwordHistory.slice(0, 5);
    }
    
    // Update user password
    user.password_hash = passwordHash;
    user.password_history = passwordHistory;
    user.password_updated_at = new Date();
    user.failed_login_attempts = 0;
    user.locked_until = null;
    await user.save();
    
    // Delete all reset tokens for this user
    await PasswordResetToken.destroy({
      where: { user_id: user.id }
    });
    
    // Invalidate all existing sessions (log out from all devices)
    await authService.logoutAll(user.id);
    
    return AppResponse.success(res, null, 'Password has been reset successfully');
  } catch (error) {
    next(error);
  }
}; 