'use strict';

/**
 * WebSocket API Routes
 * 
 * Routes for managing WebSocket connections and messages
 */
const express = require('express');
const websocketController = require('../controllers/websocket.controller');
const websocketValidator = require('../validators/websocket.validator');
const auth = require('../../../shared/middleware/auth.middleware');
const validate = require('../../../shared/middleware/validate.middleware');
const { checkRole } = require('../../../shared/middleware/rbac');

const router = express.Router();

const adminOnly = [auth.requireAuth, checkRole(['admin'])];
const authenticatedUser = [auth.requireAuth];

// Get all connections (admin only)
router.get('/connections', adminOnly, websocketController.getAllConnections);

// Get connection details (admin only)
router.get('/connections/:connectionId', adminOnly, websocketController.getConnectionById);

// Disconnect a connection (admin only)
router.post('/connections/:connectionId/disconnect', adminOnly, websocketController.disconnectConnection);

// Get user connections (admin or self)
router.get('/users/:userId/connections', authenticatedUser, websocketController.getUserConnections);

// Send message to user (admin only)
router.post('/users/:userId/messages', adminOnly, websocketController.sendMessageToUser);

// Send broadcast message (admin only)
router.post('/broadcast', adminOnly, websocketController.broadcastMessage);

// Get WebSocket server stats (admin only)
router.get('/stats', adminOnly, websocketController.getStats);

// Get user pending messages (admin only)
router.get('/users/:userId/pending-messages', adminOnly, websocketController.getUserPendingMessages);

module.exports = router; 