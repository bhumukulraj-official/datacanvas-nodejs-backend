const { jwt } = require('../../config/security');
const { UserRepository } = require('../../data/repositories/auth');
const { TokenService } = require('../../services/auth');
const jwtUtil = require('../../utils/jwt.util');
const { CustomError, InvalidTokenError, TokenExpiredError } = require('../../utils/error.util');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_003',
          message: 'Authentication required',
          timestamp: new Date().toISOString()
        }
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Check if token is revoked
    if (await TokenService.isTokenRevoked(token)) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_003',
          message: 'Token has been revoked',
          timestamp: new Date().toISOString()
        }
      });
    }

    try {
      // Verify token
      const decoded = await jwtUtil.verifyAccessToken(token);
      
      // Get user details
      const userRepository = new UserRepository();
      const user = await userRepository.getWithRoles(decoded.id);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_003',
            message: 'User not found',
            timestamp: new Date().toISOString()
          }
        });
      }

      // Set user data in request
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role || (user.UserRoles && user.UserRoles.length > 0 ? user.UserRoles[0].role : 'user')
      };
      
      next();
    } catch (error) {
      // Handle token expiration
      if (error instanceof TokenExpiredError || error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_002',
            message: 'Token expired',
            timestamp: new Date().toISOString()
          }
        });
      }
      
      // Handle invalid token
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_003',
          message: 'Invalid token',
          timestamp: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

const authorize = (roles = []) => {
  return (req, res, next) => {
    // Check if user exists in request
    if (!req.user) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PERM_001',
          message: 'Permission denied',
          timestamp: new Date().toISOString()
        }
      });
    }
    
    // If no roles required or user has the required role
    if (roles.length === 0 || roles.includes(req.user.role)) {
      return next();
    }
    
    // User doesn't have the required role
    return res.status(403).json({
      success: false,
      error: {
        code: 'PERM_001',
        message: 'Permission denied',
        timestamp: new Date().toISOString()
      }
    });
  };
};

module.exports = { authenticate, authorize }; 