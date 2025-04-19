/**
 * Authentication and authorization middleware
 * Provides JWT validation, role-based access control, IP tracking, and device tracking
 */
const jwt = require('jsonwebtoken');
const { AuthenticationError, TokenExpiredError, InvalidTokenError, PermissionError } = require('../errors');
const logger = require('../utils/logger');
const config = require('../config');
const User = require('../../modules/auth/models/User'); // Adjust path as needed
const DeviceTracker = require('../../modules/auth/services/device.service'); // Adjust path as needed

/**
 * Extract client information from request
 * @param {Object} req - Express request object
 * @returns {Object} Client information
 */
const getClientInfo = (req) => {
  const userAgent = req.get('User-Agent') || '';
  
  return {
    ip: req.ip || req.connection.remoteAddress,
    userAgent,
    device: {
      browser: userAgent.split(' ').pop(),
      os: userAgent.includes('Windows') ? 'Windows' : 
          userAgent.includes('Mac') ? 'Mac' : 
          userAgent.includes('Linux') ? 'Linux' : 
          userAgent.includes('Android') ? 'Android' : 
          userAgent.includes('iOS') ? 'iOS' : 'Other',
    },
    acceptLanguage: req.get('Accept-Language') || '',
    referrer: req.get('Referer') || '',
    timestamp: new Date().toISOString()
  };
};

/**
 * Authenticate user with JWT
 * Validates token and attaches user to request
 */
exports.requireAuth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Authentication required');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AuthenticationError('Authentication required');
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new TokenExpiredError('Token expired');
      }
      throw new InvalidTokenError('Invalid token');
    }

    // Check if user exists
    const user = await User.findByPk(decoded.sub);
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Check if token was issued before password change
    if (user.passwordChangedAt) {
      const passwordChangedTimestamp = user.passwordChangedAt.getTime() / 1000;
      if (decoded.iat < passwordChangedTimestamp) {
        throw new TokenExpiredError('User recently changed password, please log in again');
      }
    }

    // Track login info
    const clientInfo = getClientInfo(req);
    await DeviceTracker.trackLogin(user.id, clientInfo);
    
    // Log access
    logger.info(`User ${user.id} authenticated`, { 
      userId: user.id, 
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent
    });
    
    // Attach user and client info to request
    req.user = user;
    req.clientInfo = clientInfo;
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user has required roles
 * @param {Array|String} roles - Required roles
 */
exports.requireRole = (roles) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }
      
      if (!allowedRoles.includes(req.user.role)) {
        logger.warn(`Unauthorized role access attempt: ${req.user.role}`, {
          userId: req.user.id,
          requiredRoles: allowedRoles,
          userRole: req.user.role,
          endpoint: req.originalUrl
        });
        
        throw new PermissionError('You do not have permission to perform this action');
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Track suspicious activities
 */
exports.trackSuspiciousActivity = async (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }
    
    const clientInfo = getClientInfo(req);
    const isKnownDevice = await DeviceTracker.isKnownDevice(req.user.id, clientInfo);
    
    if (!isKnownDevice) {
      // Log new device login
      logger.warn(`New device login detected for user ${req.user.id}`, {
        userId: req.user.id,
        ip: clientInfo.ip,
        device: clientInfo.device
      });
      
      // Track the new device (this could send an email notification)
      await DeviceTracker.trackNewDevice(req.user.id, clientInfo);
    }
    
    next();
  } catch (error) {
    // Non-blocking - just log the error and continue
    logger.error(`Error tracking suspicious activity: ${error.message}`);
    next();
  }
};

/**
 * Optional authentication
 * Authenticates user if token is provided, but does not require authentication
 */
exports.optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next();
    }

    // Verify token
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      
      // Check if user exists
      const user = await User.findByPk(decoded.sub);
      if (user) {
        req.user = user;
        req.clientInfo = getClientInfo(req);
      }
    } catch (error) {
      // Ignore token errors in optional auth
    }
    
    next();
  } catch (error) {
    next();
  }
}; 