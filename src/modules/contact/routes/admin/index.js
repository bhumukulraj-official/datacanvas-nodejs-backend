const express = require('express');
const router = express.Router();
const contactController = require('../../controllers/contact.controller');
const contactValidator = require('../../validators/contact.validator');
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
router.get('/', contactValidator.validateListSubmissions, contactController.listContactSubmissions);

/**
 * @route GET /api/v1/contact/admin/stats/summary
 * @desc Get contact submission statistics
 * @access Admin only
 */
router.get('/stats/summary', contactController.getContactStats);

/**
 * @route GET /api/v1/contact/admin/export/data
 * @desc Export contact submissions in CSV or JSON format
 * @access Admin only
 */
router.get('/export/data', contactValidator.validateExport, contactController.exportContactSubmissions);

/**
 * @route POST /api/v1/contact/admin/bulk-update
 * @desc Bulk update contact submissions
 * @access Admin only
 */
router.post('/bulk-update', contactValidator.validateBulkUpdate, contactController.bulkUpdateContactSubmissions);

/**
 * @route POST /api/v1/contact/admin/bulk-delete
 * @desc Bulk delete contact submissions
 * @access Admin only
 */
router.post('/bulk-delete', contactValidator.validateBulkDelete, contactController.bulkDeleteContactSubmissions);

/**
 * @route GET /api/v1/contact/admin/:id
 * @desc Get a single contact submission by ID
 * @access Admin only
 */
router.get('/:id', contactValidator.validateSubmissionId, contactController.getContactSubmission);

/**
 * @route PUT /api/v1/contact/admin/:id
 * @desc Update a contact submission status or notes
 * @access Admin only
 */
router.put('/:id', contactValidator.validateUpdateSubmission, contactController.updateContactSubmission);

/**
 * @route POST /api/v1/contact/admin/:id/reply
 * @desc Reply to a contact submission
 * @access Admin only
 */
router.post('/:id/reply', contactValidator.validateReplySubmission, contactController.replyToContactSubmission);

/**
 * @route DELETE /api/v1/contact/admin/:id
 * @desc Delete a contact submission
 * @access Admin only
 */
router.delete('/:id', contactValidator.validateSubmissionId, contactController.deleteContactSubmission);

module.exports = router; 