const express = require('express');
const router = express.Router();
const contactController = require('./controllers/contact.controller');
const contactValidator = require('./validators/contact.validator');

/**
 * @api {post} /api/v1/contact Submit contact form
 * @apiDescription Submit contact form with name, email, subject, message and recaptcha token
 * @apiVersion 1.0.0
 */
router.post(
  '/',
  contactValidator.validateContactSubmission,
  contactController.submitContactForm
);

module.exports = router; 