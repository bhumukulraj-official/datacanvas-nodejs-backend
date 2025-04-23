const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contact.controller');
const { validateRequest } = require('../../../shared/middleware/validation.middleware');
const { contactSchema } = require('../validations/contact.validation');

// Register contact form submission route
router.post(
  '/submit', 
  validateRequest(contactSchema), 
  contactController.submitContactForm
);

// Import and register admin routes
const adminRoutes = require('./admin');
router.use('/admin', adminRoutes);

module.exports = router; 