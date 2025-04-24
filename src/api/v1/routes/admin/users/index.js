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

// === User Listing & Retrieval ===
// Export users as CSV (must come before /:id route to avoid conflict)
router.get('/export', userValidator.validateExportUsers, userController.exportUsers);

// Get all users with pagination and enhanced filters
router.get('/', userValidator.validateListUsers, userController.listUsers);

// Get user by ID
router.get('/:id', userValidator.validateUserId, userController.getUserById);

// === User Management ===
// Create new user
router.post('/', userValidator.validateCreateUser, userController.createUser);

// === Bulk Operations ===
// Bulk change user status
router.post('/bulk/status', userValidator.validateBulkChangeStatus, userController.bulkChangeUserStatus);

// Bulk change user role
router.post('/bulk/role', userValidator.validateBulkChangeRole, userController.bulkChangeUserRole);

// Bulk delete users
router.post('/bulk/delete', userValidator.validateBulkDeleteUsers, userController.bulkDeleteUsers);

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

// === User Audit ===
// Get user audit logs
router.get('/:id/audit-logs', userValidator.validateUserId, userController.getUserAuditLogs);

// === Session Management ===
// Get user sessions
router.get('/:id/sessions', userValidator.validateGetUserSessions, userController.getUserSessions);

// Revoke all user sessions
router.delete('/:id/sessions', userValidator.validateRevokeAllUserSessions, userController.revokeAllUserSessions);

// Revoke a specific user session
router.delete('/:id/sessions/:sessionId', userValidator.validateRevokeUserSession, userController.revokeUserSession);

module.exports = router; 