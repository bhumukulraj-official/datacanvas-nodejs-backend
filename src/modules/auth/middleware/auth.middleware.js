const jwt = require('jsonwebtoken');
const { AppError } = require('../../../shared/errors');
const User = require('../models/User');
const authService = require('../services/auth.service');
const config = require('../../../shared/config');
const logger = require('../../../shared/utils/logger');
const AuditLog = require('../models/AuditLog');

/**
 * Authenticate user using JWT with enhanced security
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
      // Use full JWT verification options for security
      decoded = jwt.verify(token, config.jwt.secret, {
        audience: config.jwt.audience || 'datacanvas-api',
        issuer: config.jwt.issuer || 'datacanvas-auth',
        algorithms: ['HS256'] // Lock down to specific algorithm
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return next(new AppError('Token expired', 401, 'AUTH_002'));
      }
      if (error.name === 'JsonWebTokenError') {
        // Log suspicious token for analysis
        logger.warn('Invalid JWT', { error: error.message, token: token.substring(0, 10) + '...' });
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

    // Check if account is active
    if (user.status !== 'active') {
      const statusMessages = {
        'inactive': 'Account is inactive. Please contact support.',
        'suspended': 'Account is temporarily suspended. Please contact support.',
        'banned': 'Account has been banned. Please contact support.'
      };
      
      const message = statusMessages[user.status] || `Account is ${user.status}. Please contact support.`;
      return next(new AppError(message, 401, 'AUTH_015'));
    }

    // Get device info for additional validation
    const deviceInfo = exports.getClientInfo(req);
    
    // Validate token context (IP, user agent, etc.)
    if (!authService.validateTokenContext(decoded, deviceInfo)) {
      // Log suspicious activity but don't immediately reject
      // This allows for legitimate cases like IP changes while adding security
      logger.warn('Suspicious token use: context mismatch', {
        userId: user.id,
        tokenId: decoded.jti,
        expectedContext: {
          ip: decoded.ip,
          ua: decoded.ua,
          fingerprint: decoded.fingerprint?.substring(0, 10) + '...'
        },
        actualContext: {
          ip: authService.hashIpAddress(deviceInfo.ip),
          ua: authService.getUAFingerprint(deviceInfo.userAgent),
          fingerprint: deviceInfo.fingerprint?.substring(0, 10) + '...'
        }
      });
      
      // Add to audit log for analysis
      await AuditLog.create({
        user_id: user.id,
        action: 'SUSPICIOUS_TOKEN_USE',
        entity_type: 'jwt',
        entity_id: null,
        description: 'Context mismatch during JWT validation',
        metadata: {
          jti: decoded.jti,
          expected_context: {
            ip: decoded.ip,
            ua: decoded.ua
          },
          actual_context: {
            ip: authService.hashIpAddress(deviceInfo.ip),
            ua: authService.getUAFingerprint(deviceInfo.userAgent)
          }
        },
        ip_address: deviceInfo.ip,
        user_agent: deviceInfo.userAgent
      });
    }

    // Add user to request
    req.user = user;
    
    // Add token data to request for potential use by other middleware
    req.token = {
      jti: decoded.jti,
      iat: decoded.iat,
      exp: decoded.exp
    };
    
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
      // Log unauthorized access attempt
      logger.warn('Unauthorized access attempt', {
        userId: req.user.id,
        requiredRoles: userRoles,
        userRole: req.user.role,
        endpoint: req.originalUrl,
        method: req.method
      });
      
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

  if (!req.user.is_email_verified) {
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
  // Get client IP address with proxy support
  const ip = req.headers['x-forwarded-for'] || 
             req.connection.remoteAddress || 
             req.socket.remoteAddress || 
             req.ip || 
             '0.0.0.0';
             
  // Clean up IP if it contains multiple addresses
  const cleanIp = ip.includes(',') ? ip.split(',')[0].trim() : ip;
  
  // Get fingerprint if available
  const fingerprint = req.headers['x-device-id'] || null;
  
  return {
    ip: cleanIp,
    userAgent: req.get('User-Agent') || '',
    acceptLanguage: req.get('Accept-Language') || '',
    fingerprint: fingerprint
  };
}; 