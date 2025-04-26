const express = require('express');
const { authenticate } = require('../../../shared/middleware/auth');
const notificationController = require('../controllers/notification.controller');
const preferenceController = require('../controllers/preference.controller');
const pushController = require('../controllers/push.controller');
const analyticsController = require('../controllers/analytics.controller');
const validate = require('../../../shared/middleware/validate');
const notificationValidator = require('../validators/notification.validator');
const preferenceValidator = require('../validators/preference.validator');
const pushValidator = require('../validators/push.validator');
const analyticsValidator = require('../validators/analytics.validator');

const router = express.Router();

// Notification routes
router.get(
  '/',
  authenticate,
  validate(notificationValidator.getUserNotifications),
  notificationController.getNotifications
);

router.post(
  '/',
  authenticate,
  validate(notificationValidator.createNotification),
  notificationController.createNotification
);

router.put(
  '/:id/read',
  authenticate,
  validate(notificationValidator.markAsRead),
  notificationController.markAsRead
);

router.put(
  '/read/all',
  authenticate,
  notificationController.markAllAsRead
);

router.delete(
  '/:id',
  authenticate,
  validate(notificationValidator.deleteNotification),
  notificationController.deleteNotification
);

// Preference routes
router.get(
  '/preferences',
  authenticate,
  preferenceController.getPreferences
);

router.put(
  '/preferences',
  authenticate,
  validate(preferenceValidator.updatePreferences),
  preferenceController.updatePreferences
);

router.post(
  '/preferences/reset',
  authenticate,
  preferenceController.resetPreferences
);

// Push notification routes
router.post(
  '/push/subscribe',
  authenticate,
  validate(pushValidator.saveSubscription),
  pushController.saveSubscription
);

router.post(
  '/push/unsubscribe',
  authenticate,
  validate(pushValidator.deleteSubscription),
  pushController.deleteSubscription
);

router.get(
  '/push/subscriptions',
  authenticate,
  pushController.getUserSubscriptions
);

router.get(
  '/push/vapid-public-key',
  authenticate,
  pushController.getVapidPublicKey
);

// Analytics routes
router.get(
  '/analytics/user',
  authenticate,
  validate(analyticsValidator.getUserAnalytics),
  analyticsController.getUserAnalytics
);

router.post(
  '/analytics/track',
  authenticate,
  validate(analyticsValidator.trackNotificationAction),
  analyticsController.trackNotificationAction
);

router.get(
  '/analytics/system',
  authenticate,
  validate(analyticsValidator.getSystemAnalytics),
  analyticsController.getSystemAnalytics
);

module.exports = router; 