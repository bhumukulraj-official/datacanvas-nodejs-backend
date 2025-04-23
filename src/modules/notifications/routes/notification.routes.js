const express = require('express');
const router = express.Router();
const { authenticateJWT, adminRequired } = require('../../../shared/middleware/auth.middleware');
const notificationController = require('../controllers/notification.controller');
const {
  validateGetNotifications,
  validateCreateNotification,
  validateUpdateNotification
} = require('../validators/notification.validator');

/**
 * @route GET /api/v1/notifications
 * @desc Get user notifications with pagination and filters
 * @access Private
 */
router.get(
  '/',
  authenticateJWT,
  validateGetNotifications,
  notificationController.getNotifications
);

/**
 * @route POST /api/v1/notifications
 * @desc Create a new notification (admin only)
 * @access Admin
 */
router.post(
  '/',
  authenticateJWT,
  adminRequired,
  validateCreateNotification,
  notificationController.createNotification
);

/**
 * @route PUT /api/v1/notifications/:id/read
 * @desc Mark a notification as read
 * @access Private
 */
router.put(
  '/:id/read',
  authenticateJWT,
  notificationController.markAsRead
);

/**
 * @route PUT /api/v1/notifications/read/all
 * @desc Mark all notifications as read
 * @access Private
 */
router.put(
  '/read/all',
  authenticateJWT,
  notificationController.markAllAsRead
);

/**
 * @route DELETE /api/v1/notifications/:id
 * @desc Delete a notification
 * @access Private
 */
router.delete(
  '/:id',
  authenticateJWT,
  notificationController.deleteNotification
);

module.exports = router; 