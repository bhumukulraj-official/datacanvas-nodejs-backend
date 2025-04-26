/**
 * Auth middleware re-export
 * This file exports the authentication middleware functions from auth.middleware.js
 */
const authMiddleware = require('./auth.middleware');

// Re-export authentication middleware
exports.requireAuth = authMiddleware.requireAuth;
exports.requireRole = authMiddleware.requireRole;
exports.optionalAuth = authMiddleware.optionalAuth;
exports.adminRequired = authMiddleware.adminRequired;

// Export authenticate alias for requireAuth for backward compatibility
exports.authenticate = authMiddleware.requireAuth; 