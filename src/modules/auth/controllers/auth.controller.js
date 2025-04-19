const authService = require('../services/auth.service');
const { AppResponse } = require('../../../shared/utils/appResponse');

/**
 * Register a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.register = async (req, res, next) => {
  try {
    const userData = req.body;
    const ip = req.ip || req.connection.remoteAddress;

    const user = await authService.register(userData, ip);

    return AppResponse.success(res, user, 'User registered successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Login a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || '';
    
    // Extract some basic device info from headers
    const deviceInfo = {
      ipAddress: ip,
      userAgent,
      acceptLanguage: req.get('Accept-Language') || '',
    };

    const result = await authService.login(email, password, ip, userAgent, deviceInfo);

    return AppResponse.success(res, result, 'Login successful');
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || '';

    const result = await authService.refreshToken(refreshToken, ip, userAgent);

    return AppResponse.success(res, result, 'Token refreshed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Logout a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.logout = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { refreshToken } = req.body;

    await authService.logout(userId, refreshToken);

    return AppResponse.success(res, null, 'Logout successful');
  } catch (error) {
    next(error);
  }
};

/**
 * Logout from all devices
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.logoutAll = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await authService.logoutAll(userId);

    return AppResponse.success(res, null, 'Logged out from all devices');
  } catch (error) {
    next(error);
  }
};

/**
 * Change user password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    await authService.changePassword(userId, currentPassword, newPassword);

    return AppResponse.success(res, null, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
}; 