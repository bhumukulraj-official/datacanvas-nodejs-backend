const { ClientInvitationService } = require('../../../services/auth');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validation.middleware');
const { schemas } = require('../../../utils/validation.util');

class ClientInvitationController {
  async createInvitation(req, res, next) {
    try {
      const invitation = await ClientInvitationService.createInvitation(
        req.user.id,
        req.body.email
      );
      res.status(201).json({
        success: true,
        data: invitation
      });
    } catch (error) {
      next(error);
    }
  }

  async acceptInvitation(req, res, next) {
    try {
      await ClientInvitationService.acceptInvitation(
        req.body.token,
        req.user.id
      );
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ClientInvitationController(); 