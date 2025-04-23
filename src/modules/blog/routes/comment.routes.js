const express = require('express');
const commentController = require('../controllers/comment.controller');
const validator = require('../validators/comment.validator');
const auth = require('../../../shared/middleware/auth.middleware');

const router = express.Router({ mergeParams: true }); // mergeParams to access postId

/**
 * Public routes - accessible without authentication
 */
router.get('/', validator.getComments, commentController.getComments);
router.post('/', validator.createComment, commentController.createComment);

/**
 * Admin routes - require authentication
 * These routes are mounted under admin routes separately
 */
router.patch('/:id/status', auth.requireAuth, validator.updateCommentStatus, commentController.updateCommentStatus);
router.delete('/:id', auth.requireAuth, validator.deleteComment, commentController.deleteComment);

module.exports = router; 