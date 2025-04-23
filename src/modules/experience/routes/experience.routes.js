/**
 * Experience routes
 */
const express = require('express');
const { experienceController } = require('../controllers');
const { auth, validate } = require('../../../middleware');
const { experienceValidator } = require('../validators');

const router = express.Router();

// Public routes (no auth required)
// Get public experiences for a specific user
router.get(
  '/public/user/:userId',
  validate(experienceValidator.getUserPublicExperiences),
  experienceController.getPublicExperiences
);

// Apply auth middleware to all remaining routes
router.use(auth());

// Get all experiences (paginated/sorted)
router.get(
  '/',
  validate(experienceValidator.getExperience),
  experienceController.getAllExperiences
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

// Get experience statistics
router.get(
  '/statistics',
  experienceController.getExperienceStatistics
);

// Export experiences
router.get(
  '/export',
  experienceController.exportExperiences
);

// Import experiences (bulk create)
router.post(
  '/import',
  validate(experienceValidator.importExperiences),
  experienceController.importExperiences
);

// Get experience by ID - must come after other specific routes
router.get(
  '/:id',
  validate(experienceValidator.getExperienceById),
  experienceController.getExperienceById
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