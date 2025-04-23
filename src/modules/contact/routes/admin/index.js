const express = require('express');
const router = express.Router();
const contactController = require('../../controllers/contact.controller');
const { authenticateJWT } = require('../../../../shared/middleware/auth.middleware');
const { authorize } = require('../../../../shared/middleware/authorization.middleware');
const { validateRequest } = require('../../../../shared/middleware/validation.middleware');

// All admin routes require authentication and admin role
router.use(authenticateJWT, authorize('admin'));

/**
 * @route GET /api/v1/contact/admin
 * @desc Get all contact submissions with pagination and filters
 * @access Admin only
 */
router.get('/', contactController.listContactSubmissions);

/**
 * @route GET /api/v1/contact/admin/:id
 * @desc Get a single contact submission by ID
 * @access Admin only
 */
router.get('/:id', contactController.getContactSubmission);

/**
 * @route PUT /api/v1/contact/admin/:id
 * @desc Update a contact submission status or notes
 * @access Admin only
 */
router.put('/:id', contactController.updateContactSubmission);

/**
 * @route POST /api/v1/contact/admin/:id/reply
 * @desc Reply to a contact submission
 * @access Admin only
 */
router.post('/:id/reply', contactController.replyToContactSubmission);

/**
 * @route DELETE /api/v1/contact/admin/:id
 * @desc Delete a contact submission
 * @access Admin only
 */
router.delete('/:id', contactController.deleteContactSubmission);

module.exports = router; 