const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const EmailVerificationToken = require('../models/EmailVerificationToken');
const { AppResponse } = require('../../../shared/utils/appResponse');
const { AppError } = require('../../../shared/errors');

/**
 * Verify user email with token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;
    
    // Find verification token
    const verificationToken = await EmailVerificationToken.findOne({
      where: { token }
    });
    
    if (!verificationToken) {
      throw new AppError('Invalid verification token', 400, 'AUTH_007');
    }
    
    // Check if token is expired
    const now = new Date();
    if (now > new Date(verificationToken.expires_at)) {
      throw new AppError('Token expired', 400, 'AUTH_008');
    }
    
    // Update user's email verification status
    const user = await User.findByPk(verificationToken.user_id);
    
    if (!user) {
      throw new AppError('User not found', 404, 'AUTH_001');
    }
    
    user.is_email_verified = true;
    await user.save();
    
    // Delete the verification token
    await verificationToken.destroy();
    
    return AppResponse.success(res, null, 'Email verified successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Resend verification email
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    // Find user by email
    const user = await User.findOne({
      where: { email }
    });
    
    if (!user) {
      throw new AppError('Email not found', 404, 'AUTH_009');
    }
    
    if (user.is_email_verified) {
      throw new AppError('Email already verified', 400, 'AUTH_010');
    }
    
    // Delete any existing verification tokens for this user
    await EmailVerificationToken.destroy({
      where: { user_id: user.id }
    });
    
    // Create new verification token
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    
    await EmailVerificationToken.create({
      user_id: user.id,
      token,
      expires_at: expiresAt
    });
    
    // In a real application, you would send an email here
    // For this implementation, we'll just return the token in the response
    // This is for testing purposes only
    
    return AppResponse.success(res, 
      { token: process.env.NODE_ENV === 'development' ? token : undefined }, 
      'Verification email sent successfully'
    );
  } catch (error) {
    next(error);
  }
}; 