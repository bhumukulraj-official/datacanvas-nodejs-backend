const express = require('express');
const controller = require('./controllers/profile.controller');
const validator = require('./validators/profile.validator');
const uploadMiddleware = require('./middleware/upload.middleware');
const auth = require('../../shared/middleware/auth.middleware');

const router = express.Router();

/**
 * @api {get} /api/v1/profile Get profile
 * @apiDescription Retrieve personal information, bio, skills, social links, and resume
 * @apiVersion 1.0.0
 */
router.get(
  '/',
  auth.requireAuth,
  validator.getProfile,
  controller.getProfile
);

/**
 * @api {put} /api/v1/profile Update profile
 * @apiDescription Update profile information
 * @apiVersion 1.0.0
 */
router.put(
  '/',
  auth.requireAuth,
  validator.updateProfile,
  controller.updateProfile
);

/**
 * @api {post} /api/v1/profile/avatar Upload profile avatar
 * @apiDescription Upload or update profile avatar
 * @apiVersion 1.0.0
 */
router.post(
  '/avatar',
  auth.requireAuth,
  uploadMiddleware.handleAvatarUpload,
  validator.uploadAvatar,
  controller.uploadAvatar
);

/**
 * @api {post} /api/v1/profile/resume Upload resume
 * @apiDescription Upload or update resume
 * @apiVersion 1.0.0
 */
router.post(
  '/resume',
  auth.requireAuth,
  uploadMiddleware.handleResumeUpload,
  validator.uploadResume,
  controller.uploadResume
);

/**
 * @api {delete} /api/v1/profile/avatar Delete profile avatar
 * @apiDescription Remove user's profile avatar
 * @apiVersion 1.0.0
 */
router.delete(
  '/avatar',
  auth.requireAuth,
  validator.deleteAvatar,
  controller.deleteAvatar
);

/**
 * @api {delete} /api/v1/profile/resume Delete resume
 * @apiDescription Remove user's resume
 * @apiVersion 1.0.0
 */
router.delete(
  '/resume',
  auth.requireAuth,
  validator.deleteResume,
  controller.deleteResume
);

/**
 * @api {get} /api/v1/profiles/:username Get public profile
 * @apiDescription Retrieve public profile by username
 * @apiVersion 1.0.0
 */
router.get(
  '/public/:username',
  validator.getPublicProfile,
  controller.getPublicProfile
);

/**
 * @api {get} /api/v1/profile/availability/:username Check username availability
 * @apiDescription Check if a username is available for use
 * @apiVersion 1.0.0
 */
router.get(
  '/availability/:username',
  validator.checkUsernameAvailability,
  controller.checkUsernameAvailability
);

module.exports = router; 