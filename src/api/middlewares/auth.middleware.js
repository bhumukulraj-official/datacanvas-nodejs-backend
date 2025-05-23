const { jwt } = require('../../config/security');
const { UserRepository } = require('../../data/repositories/auth');
const { TokenService } = require('../../services/auth');
const { CustomError, InvalidTokenError, TokenExpiredError } = require('../../utils/error.util');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new InvalidTokenError();
    }

    const token = authHeader.split(' ')[1];
    if (await TokenService.isTokenRevoked(token)) {
      throw new TokenExpiredError();
    }

    const decoded = jwtUtil.verifyAccessToken(token);
    const user = await new UserRepository().getWithRoles(decoded.id);
    
    if (!user) {
      throw new InvalidTokenError();
    }

    req.user = {
      id: user.id,
      email: user.email,
      roles: user.UserRoles.map(ur => ur.role)
    };
    
    next();
  } catch (error) {
    next(error);
  }
};

const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new InvalidTokenError());
    }
    
    if (roles.length && !roles.some(role => req.user.roles.includes(role))) {
      return next(new CustomError('Insufficient permissions', 403));
    }
    
    next();
  };
};

module.exports = { authenticate, authorize }; 