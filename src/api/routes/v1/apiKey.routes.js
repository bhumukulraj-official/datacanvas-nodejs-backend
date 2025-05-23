const express = require('express');
const router = express.Router();
const { apiKeyController } = require('../../controllers/auth');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validation.middleware');
const { schemas } = require('../../../utils/validation.util');

router.use(authenticate);
router.use(authorize(['admin']));

router.post('/',
  validate(schemas.apiKey.create, 'body'),
  apiKeyController.createApiKey
);

router.put('/:keyId/rotate',
  validate(schemas.apiKey.rotate, 'params'),
  apiKeyController.rotateApiKey
);

router.get('/',
  apiKeyController.listApiKeys
);

module.exports = router; 