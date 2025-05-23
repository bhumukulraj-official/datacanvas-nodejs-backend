const express = require('express');
const router = express.Router();
const { clientInvitationController } = require('../../controllers/auth');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validation.middleware');
const { schemas } = require('../../../utils/validation.util');

// Authenticated admin routes
router.post('/',
  authenticate,
  authorize(['admin']),
  validate(schemas.invitation.create, 'body'),
  clientInvitationController.createInvitation
);

// Public route
router.post('/accept',
  validate(schemas.invitation.accept, 'body'),
  clientInvitationController.acceptInvitation
);

module.exports = router; 