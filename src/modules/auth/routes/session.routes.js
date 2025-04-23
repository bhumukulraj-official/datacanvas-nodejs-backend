/**
 * Session management routes
 * Allows users to view and manage their active sessions
 */
const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/session.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { apiRateLimiter } = require('../../../shared/middleware/rate-limit.middleware');

// Apply authentication to all session routes
router.use(authenticate);

// Apply rate limiting
router.use(apiRateLimiter({ 
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50 // 50 requests per 5 minutes
}));

/**
 * @route GET /api/v1/auth/sessions
 * @desc Get all active sessions for current user
 * @access Private
 */
router.get('/', sessionController.getActiveSessions);

/**
 * @route GET /api/v1/auth/sessions/:sessionId
 * @desc Get detailed information about a specific session
 * @access Private
 */
router.get('/:sessionId', sessionController.getSessionDetails);

/**
 * @route DELETE /api/v1/auth/sessions/:sessionId
 * @desc Revoke a specific session
 * @access Private
 */
router.delete('/:sessionId', sessionController.revokeSession);

/**
 * @route DELETE /api/v1/auth/sessions
 * @desc Revoke all sessions except the current one
 * @access Private
 */
router.delete('/', sessionController.revokeAllSessions);

module.exports = router; 