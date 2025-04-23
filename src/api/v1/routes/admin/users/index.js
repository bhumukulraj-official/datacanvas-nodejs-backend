/**
 * Admin User Management Routes
 */
const express = require('express');
const router = express.Router();
const { authorize } = require('../../../../../shared/middleware');
const userController = require('./user.controller');
const userValidator = require('./user.validator');

// All routes require admin role
router.use(authorize('admin'));

// Get all users with pagination and filters
router.get('/', userValidator.validateListUsers, userController.listUsers);

// Get user by ID
router.get('/:id', userValidator.validateUserId, userController.getUserById);

// Create new user
router.post('/', userValidator.validateCreateUser, userController.createUser);

// Update user
router.patch('/:id', userValidator.validateUpdateUser, userController.updateUser);

// Delete user
router.delete('/:id', userValidator.validateUserId, userController.deleteUser);

// Change user role
router.patch('/:id/role', userValidator.validateChangeRole, userController.changeUserRole);

// Change user status
router.patch('/:id/status', userValidator.validateChangeStatus, userController.changeUserStatus);

// Reset user password
router.post('/:id/reset-password', userValidator.validateUserId, userController.resetUserPassword);

// Get user audit logs
router.get('/:id/audit-logs', userValidator.validateUserId, userController.getUserAuditLogs);

module.exports = router; 