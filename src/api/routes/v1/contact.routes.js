const express = require('express');
const router = express.Router();
const validate = require('../../middlewares/validation.middleware');
const { schemas } = require('../../../utils/validation.util');
const { ContactController } = require('../../controllers/content');

/**
 * @route POST /contact
 * @desc Submit a contact form
 * @access Public
 */
router.post(
  '/',
  validate(schemas.contact.submit, 'body'),
  ContactController.submitContactForm
);

module.exports = router; 