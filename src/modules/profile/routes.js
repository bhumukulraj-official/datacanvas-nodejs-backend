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

module.exports = router; 