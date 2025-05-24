const express = require('express');
const router = express.Router();
const { ClientInvitationController } = require('../../controllers/auth');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validation.middleware');
const { schemas } = require('../../../utils/validation.util');
const logger = require('../../../utils/logger.util');

// Add middleware loading log
logger.debug('Loading invitation routes with middleware:', {
  authenticate: typeof authenticate,
  authorize: typeof authorize,
  validate: typeof validate
});

// Authenticated admin routes
router.post('/',
  authenticate,
  authorize(['admin']),
  validate(schemas.invitation.create, 'body'),
  ClientInvitationController.createInvitation
);

// Public route
router.post('/accept',
  validate(schemas.invitation.accept, 'body'),
  ClientInvitationController.acceptInvitation
);

module.exports = router; 