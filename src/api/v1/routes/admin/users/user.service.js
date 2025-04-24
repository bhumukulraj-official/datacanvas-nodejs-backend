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
const json2csv = require('json2csv').Parser;
const Session = require('../../../../../modules/auth/models/Session');

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
    search,
    sort_by = 'created_at',
    sort_order = 'DESC',
    created_after,
    created_before,
    last_login_after,
    last_login_before,
    email_verified
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

  // Advanced search - allow searching in multiple fields
  if (search) {
    where[Op.or] = [
      { username: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
      { first_name: { [Op.iLike]: `%${search}%` } },
      { last_name: { [Op.iLike]: `%${search}%` } }
    ];
  }

  // Filter by creation date range
  if (created_after || created_before) {
    where.created_at = {};
    if (created_after) {
      where.created_at[Op.gte] = new Date(created_after);
    }
    if (created_before) {
      where.created_at[Op.lte] = new Date(created_before);
    }
  }

  // Filter by last login date range
  if (last_login_after || last_login_before) {
    where.last_login = {};
    if (last_login_after) {
      where.last_login[Op.gte] = new Date(last_login_after);
    }
    if (last_login_before) {
      where.last_login[Op.lte] = new Date(last_login_before);
    }
  }

  // Filter by email verification status
  if (email_verified !== undefined) {
    where.is_email_verified = email_verified === 'true';
  }

  // Validate sort parameters
  const validSortFields = ['username', 'email', 'created_at', 'updated_at', 'last_login', 'role', 'status'];
  const validSortOrders = ['ASC', 'DESC'];
  
  const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
  const sortOrder = validSortOrders.includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';

  const { count, rows } = await User.findAndCountAll({
    where,
    attributes: [
      'id', 'username', 'email', 'first_name', 'last_name',
      'role', 'status', 'is_email_verified', 'last_login',
      'created_at', 'updated_at'
    ],
    limit,
    offset,
    order: [[sortField, sortOrder]]
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
 * Validate user data before creation/update
 * @param {Object} userData - User data to validate
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {Object} Validation result with errors if any
 */
const validateUserData = (userData, isUpdate = false) => {
  const errors = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const usernameRegex = /^[a-zA-Z0-9_-]{3,50}$/;
  const nameRegex = /^[a-zA-Z\s\-']{1,50}$/;

  // Required fields for new users
  if (!isUpdate) {
    if (!userData.username) {
      errors.push({ field: 'username', message: 'Username is required' });
    }
    if (!userData.email) {
      errors.push({ field: 'email', message: 'Email is required' });
    }
    if (!userData.password) {
      errors.push({ field: 'password', message: 'Password is required' });
    }
    if (!userData.role) {
      errors.push({ field: 'role', message: 'Role is required' });
    }
  }

  // Validate username
  if (userData.username !== undefined) {
    if (!usernameRegex.test(userData.username)) {
      errors.push({ 
        field: 'username', 
        message: 'Username must be 3-50 characters and contain only letters, numbers, hyphens and underscores' 
      });
    }
  }

  // Validate email
  if (userData.email !== undefined) {
    if (!emailRegex.test(userData.email)) {
      errors.push({ field: 'email', message: 'Invalid email address' });
    }
  }

  // Validate names
  if (userData.first_name !== undefined && userData.first_name !== null && userData.first_name !== '') {
    if (!nameRegex.test(userData.first_name)) {
      errors.push({ 
        field: 'first_name', 
        message: 'First name must contain only letters, spaces, hyphens and apostrophes' 
      });
    }
  }

  if (userData.last_name !== undefined && userData.last_name !== null && userData.last_name !== '') {
    if (!nameRegex.test(userData.last_name)) {
      errors.push({ 
        field: 'last_name', 
        message: 'Last name must contain only letters, spaces, hyphens and apostrophes' 
      });
    }
  }

  // Validate roles and status
  if (userData.role !== undefined) {
    const validRoles = ['admin', 'editor', 'user'];
    if (!validRoles.includes(userData.role)) {
      errors.push({ 
        field: 'role', 
        message: 'Role must be one of: admin, editor, user' 
      });
    }
  }

  if (userData.status !== undefined) {
    const validStatuses = ['active', 'inactive', 'suspended', 'banned'];
    if (!validStatuses.includes(userData.status)) {
      errors.push({ 
        field: 'status', 
        message: 'Status must be one of: active, inactive, suspended, banned' 
      });
    }
  }

  // Validate password if provided
  if (userData.password !== undefined) {
    const passwordStrength = evaluatePasswordStrength(userData.password);
    if (!passwordStrength.strong) {
      errors.push({ 
        field: 'password', 
        message: 'Password is not strong enough', 
        details: passwordStrength.feedback 
      });
    }
  }

  // Validate avatar if provided
  if (userData.avatar !== undefined && userData.avatar !== null && userData.avatar !== '') {
    try {
      const url = new URL(userData.avatar);
      if (!['http:', 'https:'].includes(url.protocol)) {
        errors.push({ field: 'avatar', message: 'Avatar must be a valid HTTP or HTTPS URL' });
      }
    } catch (error) {
      errors.push({ field: 'avatar', message: 'Avatar must be a valid URL' });
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Create a new user
 * @param {Object} userData - User data
 * @param {number} adminId - Admin ID (for audit logging)
 * @returns {Promise<Object>} Created user
 */
exports.createUser = async (userData, adminId) => {
  // Validate user data
  const validation = validateUserData(userData);
  if (!validation.valid) {
    throw new AppError('Validation error', 400, 'USER_VAL_001', validation.errors);
  }

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
      status: userData.status || 'active',
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
  // Validate user data
  const validation = validateUserData(userData, true);
  if (!validation.valid) {
    throw new AppError('Validation error', 400, 'USER_VAL_001', validation.errors);
  }

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
      avatar: user.avatar,
      role: user.role,
      status: user.status
    };

    // Update user
    await user.update(userData, { transaction });

    // Create audit log with changes
    const changes = {};
    for (const [key, value] of Object.entries(originalValues)) {
      if (userData[key] !== undefined && userData[key] !== value) {
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
 * Generate a strong password
 * @returns {string} A strong random password
 */
const generateStrongPassword = () => {
  // Define character sets
  const uppercaseChars = 'ABCDEFGHJKLMNPQRSTUVWXY';
  const lowercaseChars = 'abcdefghijkmnopqrstuvwxyz';
  const numericChars = '23456789';
  const specialChars = '@#$%&*!?';
  
  // Generate at least one character from each set
  const upper = uppercaseChars.charAt(Math.floor(Math.random() * uppercaseChars.length));
  const lower = lowercaseChars.charAt(Math.floor(Math.random() * lowercaseChars.length));
  const number = numericChars.charAt(Math.floor(Math.random() * numericChars.length));
  const special = specialChars.charAt(Math.floor(Math.random() * specialChars.length));
  
  // Generate additional random characters from any set
  const allChars = uppercaseChars + lowercaseChars + numericChars + specialChars;
  let password = upper + lower + number + special;
  
  // Add 8 more random characters for a 12-character password
  for (let i = 0; i < 8; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }
  
  // Shuffle the password characters
  return password.split('').sort(() => 0.5 - Math.random()).join('');
};

/**
 * Evaluate password strength
 * @param {string} password - Password to evaluate
 * @returns {Object} Strength assessment
 */
const evaluatePasswordStrength = (password) => {
  const result = {
    score: 0,
    strong: false,
    feedback: []
  };
  
  // Check length
  if (password.length < 8) {
    result.feedback.push('Password is too short. It must be at least 8 characters.');
  } else if (password.length >= 12) {
    result.score += 2;
  } else {
    result.score += 1;
  }
  
  // Check for uppercase letters
  if (!/[A-Z]/.test(password)) {
    result.feedback.push('Password must contain at least one uppercase letter.');
  } else {
    result.score += 1;
  }
  
  // Check for lowercase letters
  if (!/[a-z]/.test(password)) {
    result.feedback.push('Password must contain at least one lowercase letter.');
  } else {
    result.score += 1;
  }
  
  // Check for numbers
  if (!/\d/.test(password)) {
    result.feedback.push('Password must contain at least one number.');
  } else {
    result.score += 1;
  }
  
  // Check for special characters
  if (!/[^A-Za-z0-9]/.test(password)) {
    result.feedback.push('Password must contain at least one special character.');
  } else {
    result.score += 1;
  }
  
  // Check for repeated characters
  if (/(.)\1{2,}/.test(password)) {
    result.score -= 1;
    result.feedback.push('Password contains repeated characters.');
  }
  
  // Check for common patterns
  if (/12345|qwerty|password|admin/i.test(password)) {
    result.score -= 2;
    result.feedback.push('Password contains common patterns.');
  }
  
  // A password is considered strong if it scores at least 4 points
  result.strong = result.score >= 4;
  
  return result;
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

    // Generate strong temporary password
    const tempPassword = generateStrongPassword();
    
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
        reset_by: adminId,
        password_strength: 'strong' // Always strong since we generate it
      }
    }, { transaction });

    await transaction.commit();
    
    return { 
      password: tempPassword,
      strength: {
        score: 5,
        strong: true
      }
    };
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

/**
 * Export users to CSV format
 * @param {Object} options - Filter options
 * @returns {Promise<string>} CSV data
 */
exports.exportUsers = async (options) => {
  const {
    role,
    status,
    created_after,
    created_before,
    email_verified
  } = options;

  const where = {};

  // Apply filters
  if (role) {
    where.role = role;
  }

  if (status) {
    where.status = status;
  }

  // Filter by creation date range
  if (created_after || created_before) {
    where.created_at = {};
    if (created_after) {
      where.created_at[Op.gte] = new Date(created_after);
    }
    if (created_before) {
      where.created_at[Op.lte] = new Date(created_before);
    }
  }

  // Filter by email verification status
  if (email_verified !== undefined) {
    where.is_email_verified = email_verified === 'true';
  }

  // Get all users matching criteria (limit to reasonable number to prevent memory issues)
  const users = await User.findAll({
    where,
    attributes: [
      'id', 'username', 'email', 'first_name', 'last_name',
      'role', 'status', 'is_email_verified', 'last_login',
      'created_at', 'updated_at'
    ],
    limit: 10000, // Reasonable limit for exports
    order: [['created_at', 'DESC']]
  });

  // Transform data for export
  const userData = users.map(user => ({
    id: user.id,
    username: user.username,
    email: user.email,
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
    role: user.role,
    status: user.status,
    is_email_verified: user.is_email_verified ? 'Yes' : 'No',
    last_login: user.last_login ? new Date(user.last_login).toISOString() : 'Never',
    created_at: new Date(user.created_at).toISOString(),
    account_age_days: Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24))
  }));

  // Create CSV
  const fields = [
    'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
    'role', 'status', 'is_email_verified', 'last_login', 'created_at', 'account_age_days'
  ];

  try {
    const parser = new json2csv({ fields });
    const csv = parser.parse(userData);
    return csv;
  } catch (error) {
    logger.error('Error exporting users to CSV', { error });
    throw new AppError('Failed to export users', 500, 'EXPORT_001');
  }
};

/**
 * Bulk change user status
 * @param {Array<number>} userIds - User IDs to update
 * @param {string} status - New status
 * @param {string} reason - Reason for status change
 * @param {number} adminId - Admin ID (for audit logging)
 * @returns {Promise<Object>} Result with success count and errors
 */
exports.bulkChangeUserStatus = async (userIds, status, reason, adminId) => {
  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    throw new AppError('No user IDs provided', 400, 'USER_004');
  }

  const transaction = await sequelize.transaction();
  const results = { 
    success: 0, 
    failed: 0, 
    errors: [] 
  };

  try {
    // Get all users to update
    const users = await User.findAll({
      where: {
        id: {
          [Op.in]: userIds
        }
      }
    });

    // Check if admin is trying to change their own status
    if (users.some(user => user.id === adminId)) {
      throw new AppError('Cannot change your own status', 400, 'USER_006');
    }

    // Update each user and log the change
    for (const user of users) {
      try {
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
          action: 'bulk_change_user_status',
          entity_type: 'User',
          entity_id: user.id,
          metadata: {
            username: user.username,
            from_status: originalStatus,
            to_status: status,
            reason: reason || 'No reason provided',
            bulk_operation: true
          }
        }, { transaction });
        
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          userId: user.id,
          username: user.username,
          error: error.message
        });
        logger.error('Error in bulk status change for user', { 
          error, 
          userId: user.id, 
          username: user.username 
        });
      }
    }

    await transaction.commit();
    return results;
  } catch (error) {
    await transaction.rollback();
    logger.error('Admin bulk change user status error', { error, userIds, status });
    throw error;
  }
};

/**
 * Bulk change user role
 * @param {Array<number>} userIds - User IDs to update
 * @param {string} role - New role
 * @param {number} adminId - Admin ID (for audit logging)
 * @returns {Promise<Object>} Result with success count and errors
 */
exports.bulkChangeUserRole = async (userIds, role, adminId) => {
  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    throw new AppError('No user IDs provided', 400, 'USER_004');
  }

  const transaction = await sequelize.transaction();
  const results = { 
    success: 0, 
    failed: 0, 
    errors: [] 
  };

  try {
    // Get all users to update
    const users = await User.findAll({
      where: {
        id: {
          [Op.in]: userIds
        }
      }
    });

    // Check if admin is trying to change their own role
    if (users.some(user => user.id === adminId)) {
      throw new AppError('Cannot change your own role', 400, 'USER_005');
    }

    // Update each user and log the change
    for (const user of users) {
      try {
        const originalRole = user.role;
        
        // Update role
        await user.update({ role }, { transaction });
        
        // Create audit log
        await AuditLog.create({
          user_id: adminId,
          action: 'bulk_change_user_role',
          entity_type: 'User',
          entity_id: user.id,
          metadata: {
            username: user.username,
            from_role: originalRole,
            to_role: role,
            bulk_operation: true
          }
        }, { transaction });
        
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          userId: user.id,
          username: user.username,
          error: error.message
        });
        logger.error('Error in bulk role change for user', { 
          error, 
          userId: user.id, 
          username: user.username 
        });
      }
    }

    await transaction.commit();
    return results;
  } catch (error) {
    await transaction.rollback();
    logger.error('Admin bulk change user role error', { error, userIds, role });
    throw error;
  }
};

/**
 * Bulk delete users
 * @param {Array<number>} userIds - User IDs to delete
 * @param {number} adminId - Admin ID (for audit logging)
 * @returns {Promise<Object>} Result with success count and errors
 */
exports.bulkDeleteUsers = async (userIds, adminId) => {
  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    throw new AppError('No user IDs provided', 400, 'USER_004');
  }

  const transaction = await sequelize.transaction();
  const results = { 
    success: 0, 
    failed: 0, 
    errors: [] 
  };

  try {
    // Get all users to delete
    const users = await User.findAll({
      where: {
        id: {
          [Op.in]: userIds
        }
      }
    });

    // Check if admin is trying to delete themselves
    if (users.some(user => user.id === adminId)) {
      throw new AppError('Cannot delete your own account', 400, 'USER_007');
    }

    // Delete each user and log the action
    for (const user of users) {
      try {
        // Store user data for audit log
        const userData = {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          bulk_operation: true
        };

        // Delete user (soft delete)
        await user.destroy({ transaction });

        // Create audit log
        await AuditLog.create({
          user_id: adminId,
          action: 'bulk_delete_user',
          entity_type: 'User',
          entity_id: user.id,
          metadata: userData
        }, { transaction });
        
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          userId: user.id,
          username: user.username,
          error: error.message
        });
        logger.error('Error in bulk delete for user', { 
          error, 
          userId: user.id, 
          username: user.username 
        });
      }
    }

    await transaction.commit();
    return results;
  } catch (error) {
    await transaction.rollback();
    logger.error('Admin bulk delete users error', { error, userIds });
    throw error;
  }
};

/**
 * Get active sessions for a user
 * @param {number} userId - User ID
 * @param {Object} options - Pagination options
 * @returns {Promise<Object>} Sessions and pagination data
 */
exports.getUserSessions = async (userId, options) => {
  const { page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;

  // Check if user exists
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_001');
  }

  // Get sessions for this user
  const { count, rows } = await Session.findAndCountAll({
    where: {
      user_id: userId,
      expires_at: {
        [Op.gt]: new Date()
      }
    },
    order: [['last_used_at', 'DESC'], ['created_at', 'DESC']],
    limit,
    offset
  });

  // Transform session data to include additional information
  const sessions = rows.map(session => ({
    id: session.id,
    device: session.device_name || 'Unknown Device',
    ip_address: session.ip_address || 'Unknown',
    last_used: session.last_used_at || session.created_at,
    created_at: session.created_at,
    expires_at: session.expires_at,
    is_active: !session.is_revoked && new Date(session.expires_at) > new Date(),
    is_revoked: session.is_revoked,
    user_agent: session.user_agent
  }));

  return {
    sessions,
    pagination: {
      total: count,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      pages: Math.ceil(count / limit)
    }
  };
};

/**
 * Revoke a user session
 * @param {number} userId - User ID
 * @param {number} sessionId - Session ID
 * @param {number} adminId - Admin ID (for audit logging)
 * @returns {Promise<boolean>} Success status
 */
exports.revokeUserSession = async (userId, sessionId, adminId) => {
  // Check if user exists
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_001');
  }

  // Check if session exists and belongs to user
  const session = await Session.findOne({
    where: {
      id: sessionId,
      user_id: userId
    }
  });

  if (!session) {
    throw new AppError('Session not found', 404, 'SESSION_001');
  }

  // Check if session is already revoked
  if (session.is_revoked) {
    throw new AppError('Session is already revoked', 400, 'SESSION_002');
  }

  const transaction = await sequelize.transaction();

  try {
    // Revoke session
    await session.update({ is_revoked: true }, { transaction });

    // Log the action
    await AuditLog.create({
      user_id: adminId,
      action: 'revoke_user_session',
      entity_type: 'User',
      entity_id: userId,
      metadata: {
        username: user.username,
        session_id: session.id,
        device: session.device_name || 'Unknown Device',
        ip_address: session.ip_address || 'Unknown'
      }
    }, { transaction });

    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    logger.error('Admin revoke user session error', { error, userId, sessionId });
    throw error;
  }
};

/**
 * Revoke all sessions for a user
 * @param {number} userId - User ID
 * @param {number} adminId - Admin ID (for audit logging)
 * @returns {Promise<number>} Number of revoked sessions
 */
exports.revokeAllUserSessions = async (userId, adminId) => {
  // Check if user exists
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_001');
  }

  const transaction = await sequelize.transaction();

  try {
    // Revoke all active sessions
    const [affectedCount] = await Session.update(
      { is_revoked: true },
      {
        where: {
          user_id: userId,
          is_revoked: false,
          expires_at: {
            [Op.gt]: new Date()
          }
        },
        transaction
      }
    );

    // Log the action if any sessions were revoked
    if (affectedCount > 0) {
      await AuditLog.create({
        user_id: adminId,
        action: 'revoke_all_user_sessions',
        entity_type: 'User',
        entity_id: userId,
        metadata: {
          username: user.username,
          sessions_revoked: affectedCount
        }
      }, { transaction });
    }

    await transaction.commit();
    return affectedCount;
  } catch (error) {
    await transaction.rollback();
    logger.error('Admin revoke all user sessions error', { error, userId });
    throw error;
  }
}; 