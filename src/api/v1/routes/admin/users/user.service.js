/**
 * Admin User Management Service
 */
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { Op } = require('sequelize');
const User = require('../../../../../modules/auth/models/User');
const AuditLog = require('../../../../../modules/security/models/AuditLog');
const { AppError } = require('../../../../../shared/errors');
const logger = require('../../../../../shared/utils/logger');
const { sequelize } = require('../../../../../shared/database');

/**
 * List all users with pagination and filters
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Users and pagination data
 */
exports.listUsers = async (options) => {
  const {
    page = 1,
    limit = 20,
    role,
    status,
    search
  } = options;

  const offset = (page - 1) * limit;
  const where = {};

  // Apply filters
  if (role) {
    where.role = role;
  }

  if (status) {
    where.status = status;
  }

  if (search) {
    where[Op.or] = [
      { username: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
      { first_name: { [Op.iLike]: `%${search}%` } },
      { last_name: { [Op.iLike]: `%${search}%` } }
    ];
  }

  const { count, rows } = await User.findAndCountAll({
    where,
    attributes: [
      'id', 'username', 'email', 'first_name', 'last_name',
      'role', 'status', 'is_email_verified', 'last_login',
      'created_at', 'updated_at'
    ],
    limit,
    offset,
    order: [['created_at', 'DESC']]
  });

  return {
    users: rows,
    pagination: {
      total: count,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      pages: Math.ceil(count / limit)
    }
  };
};

/**
 * Get a user by ID
 * @param {number} id - User ID
 * @returns {Promise<Object>} User data
 */
exports.getUserById = async (id) => {
  const user = await User.findByPk(id, {
    attributes: [
      'id', 'username', 'email', 'first_name', 'last_name', 'bio',
      'avatar', 'role', 'status', 'is_email_verified', 'last_login',
      'login_attempts', 'locked_until', 'created_at', 'updated_at'
    ]
  });

  if (!user) {
    throw new AppError('User not found', 404, 'USER_001');
  }

  return user;
};

/**
 * Create a new user
 * @param {Object} userData - User data
 * @param {number} adminId - Admin ID (for audit logging)
 * @returns {Promise<Object>} Created user
 */
exports.createUser = async (userData, adminId) => {
  const transaction = await sequelize.transaction();
  
  try {
    // Check if username or email already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { username: userData.username },
          { email: userData.email }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.username === userData.username) {
        throw new AppError('Username already exists', 400, 'USER_002');
      } else {
        throw new AppError('Email already exists', 400, 'USER_003');
      }
    }

    // Generate password salt and hash
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    // Create user
    const user = await User.create({
      username: userData.username,
      email: userData.email,
      password: hashedPassword,
      password_salt: salt,
      first_name: userData.first_name,
      last_name: userData.last_name,
      role: userData.role,
      status: userData.status,
      is_email_verified: false
    }, { transaction });

    // Create audit log
    await AuditLog.create({
      user_id: adminId,
      action: 'create_user',
      entity_type: 'User',
      entity_id: user.id,
      metadata: {
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status
      }
    }, { transaction });

    await transaction.commit();

    // Return user without sensitive data
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      status: user.status,
      created_at: user.created_at
    };
  } catch (error) {
    await transaction.rollback();
    logger.error('Admin create user error', { error, userData });
    throw error;
  }
};

/**
 * Update a user
 * @param {number} id - User ID
 * @param {Object} userData - User data to update
 * @param {number} adminId - Admin ID (for audit logging)
 * @returns {Promise<Object>} Updated user
 */
exports.updateUser = async (id, userData, adminId) => {
  const transaction = await sequelize.transaction();
  
  try {
    const user = await User.findByPk(id);

    if (!user) {
      throw new AppError('User not found', 404, 'USER_001');
    }

    // Check for username or email uniqueness if they're being updated
    if (userData.username && userData.username !== user.username) {
      const existingUser = await User.findOne({
        where: { username: userData.username }
      });

      if (existingUser) {
        throw new AppError('Username already exists', 400, 'USER_002');
      }
    }

    if (userData.email && userData.email !== user.email) {
      const existingUser = await User.findOne({
        where: { email: userData.email }
      });

      if (existingUser) {
        throw new AppError('Email already exists', 400, 'USER_003');
      }
    }

    // Store original values for audit log
    const originalValues = {
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      bio: user.bio,
      avatar: user.avatar
    };

    // Update user
    await user.update(userData, { transaction });

    // Create audit log with changes
    const changes = {};
    for (const [key, value] of Object.entries(originalValues)) {
      if (userData[key] && userData[key] !== value) {
        changes[key] = {
          from: value,
          to: userData[key]
        };
      }
    }

    if (Object.keys(changes).length > 0) {
      await AuditLog.create({
        user_id: adminId,
        action: 'update_user',
        entity_type: 'User',
        entity_id: user.id,
        metadata: {
          changes,
          username: user.username
        }
      }, { transaction });
    }

    await transaction.commit();

    // Return updated user without sensitive data
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      bio: user.bio,
      avatar: user.avatar,
      role: user.role,
      status: user.status,
      updated_at: user.updated_at
    };
  } catch (error) {
    await transaction.rollback();
    logger.error('Admin update user error', { error, id, userData });
    throw error;
  }
};

/**
 * Delete a user
 * @param {number} id - User ID
 * @param {number} adminId - Admin ID (for audit logging)
 * @returns {Promise<boolean>} Success status
 */
exports.deleteUser = async (id, adminId) => {
  const transaction = await sequelize.transaction();
  
  try {
    const user = await User.findByPk(id);

    if (!user) {
      throw new AppError('User not found', 404, 'USER_001');
    }

    // Store user data for audit log
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    // Delete user (soft delete)
    await user.destroy({ transaction });

    // Create audit log
    await AuditLog.create({
      user_id: adminId,
      action: 'delete_user',
      entity_type: 'User',
      entity_id: id,
      metadata: userData
    }, { transaction });

    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    logger.error('Admin delete user error', { error, id });
    throw error;
  }
};

/**
 * Change user role
 * @param {number} id - User ID
 * @param {string} role - New role
 * @param {number} adminId - Admin ID (for audit logging)
 * @returns {Promise<Object>} Updated user
 */
exports.changeUserRole = async (id, role, adminId) => {
  const transaction = await sequelize.transaction();
  
  try {
    const user = await User.findByPk(id);

    if (!user) {
      throw new AppError('User not found', 404, 'USER_001');
    }

    // Prevent changing your own role
    if (user.id === adminId) {
      throw new AppError('Cannot change your own role', 400, 'USER_005');
    }

    const originalRole = user.role;

    // Update role
    await user.update({ role }, { transaction });

    // Create audit log
    await AuditLog.create({
      user_id: adminId,
      action: 'change_user_role',
      entity_type: 'User',
      entity_id: user.id,
      metadata: {
        username: user.username,
        from_role: originalRole,
        to_role: role
      }
    }, { transaction });

    await transaction.commit();
    return user;
  } catch (error) {
    await transaction.rollback();
    logger.error('Admin change user role error', { error, id, role });
    throw error;
  }
};

/**
 * Change user status
 * @param {number} id - User ID
 * @param {string} status - New status
 * @param {string} reason - Reason for status change
 * @param {number} adminId - Admin ID (for audit logging)
 * @returns {Promise<Object>} Updated user
 */
exports.changeUserStatus = async (id, status, reason, adminId) => {
  const transaction = await sequelize.transaction();
  
  try {
    const user = await User.findByPk(id);

    if (!user) {
      throw new AppError('User not found', 404, 'USER_001');
    }

    // Prevent changing your own status
    if (user.id === adminId) {
      throw new AppError('Cannot change your own status', 400, 'USER_006');
    }

    const originalStatus = user.status;

    // Update status
    await user.update({ status }, { transaction });

    // Reset locked_until if status is active
    if (status === 'active' && user.locked_until) {
      await user.update({ locked_until: null, login_attempts: 0 }, { transaction });
    }

    // Create audit log
    await AuditLog.create({
      user_id: adminId,
      action: 'change_user_status',
      entity_type: 'User',
      entity_id: user.id,
      metadata: {
        username: user.username,
        from_status: originalStatus,
        to_status: status,
        reason: reason || 'No reason provided'
      }
    }, { transaction });

    await transaction.commit();
    return user;
  } catch (error) {
    await transaction.rollback();
    logger.error('Admin change user status error', { error, id, status });
    throw error;
  }
};

/**
 * Reset user password
 * @param {number} id - User ID
 * @param {number} adminId - Admin ID (for audit logging)
 * @returns {Promise<Object>} New temporary password
 */
exports.resetUserPassword = async (id, adminId) => {
  const transaction = await sequelize.transaction();
  
  try {
    const user = await User.findByPk(id);

    if (!user) {
      throw new AppError('User not found', 404, 'USER_001');
    }

    // Generate temporary password
    const tempPassword = crypto.randomBytes(4).toString('hex');
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    // Update user password
    await user.update({
      password: hashedPassword,
      password_salt: salt,
      // Force password change on next login would be implemented here
    }, { transaction });

    // Create audit log (don't include the new password in the log)
    await AuditLog.create({
      user_id: adminId,
      action: 'reset_user_password',
      entity_type: 'User',
      entity_id: user.id,
      metadata: {
        username: user.username,
        reset_by: adminId
      }
    }, { transaction });

    await transaction.commit();
    
    return { password: tempPassword };
  } catch (error) {
    await transaction.rollback();
    logger.error('Admin reset user password error', { error, id });
    throw error;
  }
};

/**
 * Get user audit logs
 * @param {number} id - User ID
 * @param {Object} options - Pagination options
 * @returns {Promise<Object>} Audit logs and pagination data
 */
exports.getUserAuditLogs = async (id, options) => {
  const { page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;

  // Check if user exists
  const user = await User.findByPk(id);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_001');
  }

  // Get audit logs for this user
  const { count, rows } = await AuditLog.findAndCountAll({
    where: {
      [Op.or]: [
        { user_id: id }, // Actions performed by this user
        { entity_type: 'User', entity_id: id } // Actions performed on this user
      ]
    },
    limit,
    offset,
    order: [['created_at', 'DESC']]
  });

  return {
    logs: rows,
    pagination: {
      total: count,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      pages: Math.ceil(count / limit)
    }
  };
}; 