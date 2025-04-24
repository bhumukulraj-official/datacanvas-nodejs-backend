/**
 * Admin User Management Controller
 */
const userService = require('./user.service');
const { AppError } = require('../../../../../shared/errors');
const logger = require('../../../../../shared/utils/logger');

/**
 * List all users with pagination and filters
 */
exports.listUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, status, search } = req.query;
    
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      role,
      status,
      search
    };
    
    const result = await userService.listUsers(options);
    
    res.status(200).json({
      success: true,
      data: {
        users: result.users,
        pagination: result.pagination
      },
      message: 'Users retrieved successfully'
    });
  } catch (error) {
    logger.error('Admin user list error', { error });
    next(error);
  }
};

/**
 * Get user by ID
 */
exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const user = await userService.getUserById(id);
    
    res.status(200).json({
      success: true,
      data: user,
      message: 'User retrieved successfully'
    });
  } catch (error) {
    logger.error('Admin get user error', { error, userId: req.params.id });
    next(error);
  }
};

/**
 * Create a new user
 */
exports.createUser = async (req, res, next) => {
  try {
    const userData = req.body;
    const adminId = req.user.id; // Admin performing the action
    
    const user = await userService.createUser(userData, adminId);
    
    res.status(201).json({
      success: true,
      data: user,
      message: 'User created successfully'
    });
  } catch (error) {
    logger.error('Admin create user error', { error });
    next(error);
  }
};

/**
 * Update a user
 */
exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userData = req.body;
    const adminId = req.user.id; // Admin performing the action
    
    const user = await userService.updateUser(id, userData, adminId);
    
    res.status(200).json({
      success: true,
      data: user,
      message: 'User updated successfully'
    });
  } catch (error) {
    logger.error('Admin update user error', { error, userId: req.params.id });
    next(error);
  }
};

/**
 * Delete a user
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id; // Admin performing the action
    
    await userService.deleteUser(id, adminId);
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    logger.error('Admin delete user error', { error, userId: req.params.id });
    next(error);
  }
};

/**
 * Change user role
 */
exports.changeUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const adminId = req.user.id; // Admin performing the action
    
    const user = await userService.changeUserRole(id, role, adminId);
    
    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        role: user.role
      },
      message: `User role changed to ${role} successfully`
    });
  } catch (error) {
    logger.error('Admin change user role error', { error, userId: req.params.id });
    next(error);
  }
};

/**
 * Change user status
 */
exports.changeUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    const adminId = req.user.id; // Admin performing the action
    
    const user = await userService.changeUserStatus(id, status, reason, adminId);
    
    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        status: user.status
      },
      message: `User status changed to ${status} successfully`
    });
  } catch (error) {
    logger.error('Admin change user status error', { error, userId: req.params.id });
    next(error);
  }
};

/**
 * Reset user password
 */
exports.resetUserPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id; // Admin performing the action
    
    const { password } = await userService.resetUserPassword(id, adminId);
    
    res.status(200).json({
      success: true,
      data: {
        tempPassword: password
      },
      message: 'User password reset successfully'
    });
  } catch (error) {
    logger.error('Admin reset user password error', { error, userId: req.params.id });
    next(error);
  }
};

/**
 * Get user audit logs
 */
exports.getUserAuditLogs = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
    };
    
    const result = await userService.getUserAuditLogs(id, options);
    
    res.status(200).json({
      success: true,
      data: {
        logs: result.logs,
        pagination: result.pagination
      },
      message: 'User audit logs retrieved successfully'
    });
  } catch (error) {
    logger.error('Admin get user audit logs error', { error, userId: req.params.id });
    next(error);
  }
};

/**
 * Export users as CSV
 */
exports.exportUsers = async (req, res, next) => {
  try {
    const { role, status, created_after, created_before, email_verified } = req.query;
    
    const options = {
      role,
      status,
      created_after,
      created_before,
      email_verified
    };
    
    const csv = await userService.exportUsers(options);
    
    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
    
    res.status(200).send(csv);
  } catch (error) {
    logger.error('Admin export users error', { error });
    next(error);
  }
};

/**
 * Bulk change user status
 */
exports.bulkChangeUserStatus = async (req, res, next) => {
  try {
    const { userIds, status, reason } = req.body;
    const adminId = req.user.id;
    
    const result = await userService.bulkChangeUserStatus(userIds, status, reason, adminId);
    
    res.status(200).json({
      success: true,
      data: result,
      message: `Changed status to ${status} for ${result.success} users`
    });
  } catch (error) {
    logger.error('Admin bulk change user status error', { error });
    next(error);
  }
};

/**
 * Bulk change user role
 */
exports.bulkChangeUserRole = async (req, res, next) => {
  try {
    const { userIds, role } = req.body;
    const adminId = req.user.id;
    
    const result = await userService.bulkChangeUserRole(userIds, role, adminId);
    
    res.status(200).json({
      success: true,
      data: result,
      message: `Changed role to ${role} for ${result.success} users`
    });
  } catch (error) {
    logger.error('Admin bulk change user role error', { error });
    next(error);
  }
};

/**
 * Bulk delete users
 */
exports.bulkDeleteUsers = async (req, res, next) => {
  try {
    const { userIds } = req.body;
    const adminId = req.user.id;
    
    const result = await userService.bulkDeleteUsers(userIds, adminId);
    
    res.status(200).json({
      success: true,
      data: result,
      message: `Deleted ${result.success} users`
    });
  } catch (error) {
    logger.error('Admin bulk delete users error', { error });
    next(error);
  }
};

/**
 * Get user sessions
 */
exports.getUserSessions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
    };
    
    const result = await userService.getUserSessions(id, options);
    
    res.status(200).json({
      success: true,
      data: {
        sessions: result.sessions,
        pagination: result.pagination
      },
      message: 'User sessions retrieved successfully'
    });
  } catch (error) {
    logger.error('Admin get user sessions error', { error, userId: req.params.id });
    next(error);
  }
};

/**
 * Revoke user session
 */
exports.revokeUserSession = async (req, res, next) => {
  try {
    const { id, sessionId } = req.params;
    const adminId = req.user.id;
    
    await userService.revokeUserSession(id, sessionId, adminId);
    
    res.status(200).json({
      success: true,
      message: 'User session revoked successfully'
    });
  } catch (error) {
    logger.error('Admin revoke user session error', { 
      error, 
      userId: req.params.id,
      sessionId: req.params.sessionId
    });
    next(error);
  }
};

/**
 * Revoke all user sessions
 */
exports.revokeAllUserSessions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    
    const count = await userService.revokeAllUserSessions(id, adminId);
    
    res.status(200).json({
      success: true,
      data: { count },
      message: `${count} user sessions revoked successfully`
    });
  } catch (error) {
    logger.error('Admin revoke all user sessions error', { error, userId: req.params.id });
    next(error);
  }
}; 