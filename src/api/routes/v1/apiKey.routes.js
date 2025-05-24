const express = require('express');
const router = express.Router();
const { ApiKeyController } = require('../../controllers/auth');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validation.middleware');
const { schemas } = require('../../../utils/validation.util');

router.use(authenticate);
router.use(authorize(['admin']));

router.post('/',
  validate(schemas.apiKey.create, 'body'),
  ApiKeyController.createApiKey
);

router.put('/:keyId/rotate',
  validate(schemas.apiKey.rotate, 'params'),
  ApiKeyController.rotateApiKey
);

router.get('/',
  ApiKeyController.listApiKeys
);

module.exports = router; 