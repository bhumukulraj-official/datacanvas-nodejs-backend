/**
 * Experience routes
 */
const express = require('express');
const { experienceController } = require('../controllers');
const { auth, validate } = require('../../../middleware');
const { experienceValidator } = require('../validators');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth());

// Get all experiences (paginated/sorted)
router.get(
  '/',
  validate(experienceValidator.getExperience),
  experienceController.getAllExperiences
);

// Get experience by ID
router.get(
  '/:id',
  validate(experienceValidator.getExperienceById),
  experienceController.getExperienceById
);

// Get current experiences (with no end date)
router.get(
  '/current',
  experienceController.getCurrentExperiences
);

// Get current experiences for specific user
router.get(
  '/user/:userId/current',
  experienceController.getCurrentExperiences
);

// Create new experience
router.post(
  '/',
  validate(experienceValidator.createExperience),
  experienceController.createExperience
);

// Update experience
router.patch(
  '/:id',
  validate(experienceValidator.updateExperience),
  experienceController.updateExperience
);

// Delete experience
router.delete(
  '/:id',
  validate(experienceValidator.deleteExperience),
  experienceController.deleteExperience
);

module.exports = router; 