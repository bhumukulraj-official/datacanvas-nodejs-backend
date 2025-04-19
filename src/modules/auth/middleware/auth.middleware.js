const jwt = require('jsonwebtoken');
const { AppError } = require('../../../shared/errors');
const User = require('../models/User');

/**
 * Authenticate user using JWT
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Authentication required', 401, 'AUTH_001'));
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next(new AppError('Authentication required', 401, 'AUTH_001'));
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return next(new AppError('Token expired', 401, 'AUTH_002'));
      }
      return next(new AppError('Invalid token', 401, 'AUTH_003'));
    }

    // Check if user exists
    const user = await User.findByPk(decoded.sub);
    if (!user) {
      return next(new AppError('User not found', 404, 'NOT_001'));
    }

    // Check for password changes after token was issued
    const passwordChangedAt = user.password_updated_at ? new Date(user.password_updated_at) : null;
    if (passwordChangedAt) {
      const tokenIssuedAt = new Date(decoded.iat * 1000);
      if (passwordChangedAt > tokenIssuedAt) {
        return next(new AppError('User recently changed password. Please login again', 401, 'AUTH_016'));
      }
    }

    // Add user to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user has required role
 * @param {Array|String} roles - Required roles
 * @returns {Function} Middleware function
 */
exports.authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'AUTH_001'));
    }

    const userRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!userRoles.includes(req.user.role)) {
      return next(new AppError('Not authorized to access this resource', 403, 'PERM_001'));
    }

    next();
  };
};

/**
 * Check if email is verified
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.checkEmailVerified = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401, 'AUTH_001'));
  }

  if (!req.user.email_verified) {
    return next(new AppError('Email not verified', 403, 'AUTH_017'));
  }

  next();
};

/**
 * Extract client info from request
 * @param {Object} req - Express request object
 * @returns {Object} Client info object
 */
exports.getClientInfo = (req) => {
  return {
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent') || '',
    acceptLanguage: req.get('Accept-Language') || '',
  };
}; 