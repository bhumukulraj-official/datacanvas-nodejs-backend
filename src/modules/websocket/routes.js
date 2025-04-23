const express = require('express');
const websocketController = require('./controllers/websocket.controller');
const websocketValidator = require('./validators/websocket.validator');
const auth = require('../../shared/middleware/auth.middleware');
const validate = require('../../shared/middleware/validate.middleware');

const router = express.Router();

// Protected routes - require authentication
router.get('/connections', 
  auth.requireAuth, 
  auth.requireRole(['admin', 'editor']), 
  validate(websocketValidator.getAllConnections), 
  websocketController.getAllConnections
);

router.get('/connections/users/:userId', 
  auth.requireAuth, 
  validate(websocketValidator.getUserConnections), 
  websocketController.getUserConnections
);

router.get('/connections/:connectionId', 
  auth.requireAuth, 
  validate(websocketValidator.getConnectionById), 
  websocketController.getConnectionById
);

router.post('/connections/:connectionId/disconnect', 
  auth.requireAuth, 
  auth.requireRole('admin'), 
  validate(websocketValidator.disconnectConnection), 
  websocketController.disconnectConnection
);

router.post('/messages/users/:userId', 
  auth.requireAuth, 
  auth.requireRole(['admin', 'editor']), 
  validate(websocketValidator.sendMessageToUser), 
  websocketController.sendMessageToUser
);

router.post('/messages/broadcast', 
  auth.requireAuth, 
  auth.requireRole('admin'), 
  validate(websocketValidator.broadcastMessage), 
  websocketController.broadcastMessage
);

router.get('/stats', 
  auth.requireAuth, 
  auth.requireRole('admin'), 
  websocketController.getStats
);

module.exports = router; 