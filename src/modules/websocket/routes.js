/**
 * WebSocket API Routes
 * 
 * Routes for managing WebSocket connections and messages
 */
const express = require('express');
const websocketController = require('./controllers/websocket.controller');
const websocketValidator = require('./validators/websocket.validator');
const auth = require('../../shared/middleware/auth.middleware');
const validate = require('../../shared/middleware/validate.middleware');
const { checkRole } = require('../../shared/middleware/rbac');

const router = express.Router();

const adminOnly = [auth.requireAuth, checkRole(['admin'])];
const authenticatedUser = [auth.requireAuth];

/**
 * @swagger
 * /api/websocket/connections:
 *   get:
 *     summary: Get all active WebSocket connections
 *     description: Retrieve a list of all active WebSocket connections (Admin only)
 *     tags: [WebSocket]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, disconnected]
 *         description: Filter by connection status
 *     responses:
 *       '200':
 *         description: Connections retrieved successfully
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Forbidden - Admin access required
 */
router.get('/connections', adminOnly, websocketController.getAllConnections);

/**
 * @swagger
 * /api/websocket/connections/{connectionId}:
 *   get:
 *     summary: Get connection details
 *     description: Retrieve details of a specific WebSocket connection (Admin only)
 *     tags: [WebSocket]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: connectionId
 *         required: true
 *         schema:
 *           type: string
 *         description: WebSocket connection ID
 *     responses:
 *       '200':
 *         description: Connection retrieved successfully
 *       '404':
 *         description: Connection not found
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Forbidden - Admin access required
 */
router.get('/connections/:connectionId', adminOnly, websocketController.getConnectionById);

/**
 * @swagger
 * /api/websocket/connections/{connectionId}/disconnect:
 *   post:
 *     summary: Disconnect a WebSocket connection
 *     description: Forcefully disconnect a specific WebSocket connection (Admin only)
 *     tags: [WebSocket]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: connectionId
 *         required: true
 *         schema:
 *           type: string
 *         description: WebSocket connection ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for disconnection
 *     responses:
 *       '200':
 *         description: Connection disconnected successfully
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Forbidden - Admin access required
 */
router.post('/connections/:connectionId/disconnect', adminOnly, websocketController.disconnectConnection);

/**
 * @swagger
 * /api/websocket/users/{userId}/connections:
 *   get:
 *     summary: Get user connections
 *     description: Retrieve all WebSocket connections for a specific user (Admin or self)
 *     tags: [WebSocket]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, disconnected]
 *         description: Filter by connection status
 *     responses:
 *       '200':
 *         description: User connections retrieved successfully
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Forbidden - Admin access required or must be the user
 */
router.get('/users/:userId/connections', authenticatedUser, websocketController.getUserConnections);

/**
 * @swagger
 * /api/websocket/users/{userId}/messages:
 *   post:
 *     summary: Send message to user
 *     description: Send a WebSocket message to a specific user (Admin only)
 *     tags: [WebSocket]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - payload
 *             properties:
 *               type:
 *                 type: string
 *                 description: Message type
 *               payload:
 *                 type: object
 *                 description: Message payload
 *               priority:
 *                 type: boolean
 *                 description: Whether this is a high priority message
 *               requireAck:
 *                 type: boolean
 *                 description: Whether message acknowledgment is required
 *               channel:
 *                 type: string
 *                 description: Channel to send on (defaults to direct)
 *     responses:
 *       '200':
 *         description: Message sent successfully
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Forbidden - Admin access required
 */
router.post('/users/:userId/messages', adminOnly, websocketController.sendMessageToUser);

/**
 * @swagger
 * /api/websocket/broadcast:
 *   post:
 *     summary: Broadcast message
 *     description: Send a WebSocket message to all users or a specific channel (Admin only)
 *     tags: [WebSocket]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - channel
 *               - type
 *               - payload
 *             properties:
 *               channel:
 *                 type: string
 *                 description: Channel to broadcast to
 *               type:
 *                 type: string
 *                 description: Message type
 *               payload:
 *                 type: object
 *                 description: Message payload
 *               priority:
 *                 type: boolean
 *                 description: Whether this is a high priority message
 *               requireAck:
 *                 type: boolean
 *                 description: Whether message acknowledgment is required
 *     responses:
 *       '200':
 *         description: Broadcast sent successfully
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Forbidden - Admin access required
 */
router.post('/broadcast', adminOnly, websocketController.broadcastMessage);

/**
 * @swagger
 * /api/websocket/stats:
 *   get:
 *     summary: WebSocket server stats
 *     description: Get WebSocket server statistics (Admin only)
 *     tags: [WebSocket]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: Statistics retrieved successfully
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Forbidden - Admin access required
 */
router.get('/stats', adminOnly, websocketController.getStats);

/**
 * @swagger
 * /api/websocket/users/{userId}/pending-messages:
 *   get:
 *     summary: Get pending messages
 *     description: Get pending WebSocket messages for a user (Admin only)
 *     tags: [WebSocket]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of messages to return
 *       - in: query
 *         name: onlyHighPriority
 *         schema:
 *           type: boolean
 *         description: Only return high priority messages
 *     responses:
 *       '200':
 *         description: Pending messages retrieved successfully
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Forbidden - Admin access required
 */
router.get('/users/:userId/pending-messages', adminOnly, websocketController.getUserPendingMessages);

/**
 * @swagger
 * /api/websocket/message-stats:
 *   get:
 *     summary: Get message statistics
 *     description: Get statistics about WebSocket message delivery (Admin only)
 *     tags: [WebSocket]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [24h, 7d, 30d]
 *         description: Timeframe for statistics
 *     responses:
 *       '200':
 *         description: Message statistics retrieved successfully
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Forbidden - Admin access required
 */
router.get('/message-stats', adminOnly, websocketController.getMessageStats);

/**
 * @swagger
 * /api/websocket/cleanup:
 *   post:
 *     summary: Cleanup old messages
 *     description: Remove old WebSocket messages from storage (Admin only)
 *     tags: [WebSocket]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: Old messages cleaned up successfully
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Forbidden - Admin access required
 */
router.post('/cleanup', adminOnly, websocketController.cleanupOldMessages);

module.exports = router; 