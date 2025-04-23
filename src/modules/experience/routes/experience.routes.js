/**
 * Experience routes
 */
const express = require('express');
const { experienceController } = require('../controllers');
const { auth, validate } = require('../../../middleware');
const { experienceValidator } = require('../validators');
const { cacheMiddleware } = require('../../../shared/cache');
const config = require('../../../shared/config');

const router = express.Router();

// Public routes (no auth required)
// Get public experiences for a specific user
router.get(
  '/public/user/:userId',
  validate(experienceValidator.getUserPublicExperiences),
  cacheMiddleware(300), // 5 minutes cache
  experienceController.getPublicExperiences
);

// Get public experiences by technology
router.get(
  '/public/technology/:technology',
  validate(experienceValidator.getExperiencesByTechnology),
  cacheMiddleware(300), // 5 minutes cache
  experienceController.getPublicExperiencesByTechnology
);

// Apply auth middleware to all remaining routes
router.use(auth());

// Get all experiences (paginated/sorted/filtered)
router.get(
  '/',
  validate(experienceValidator.getExperience),
  experienceController.getAllExperiences
);

// Get experiences by technology
router.get(
  '/technology/:technology',
  validate(experienceValidator.getExperiencesByTechnology),
  experienceController.getExperiencesByTechnology
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
  cacheMiddleware(config.cache.experienceApiTtl),
  experienceController.getExperienceStatistics
);

// Export experiences
router.get(
  '/export',
  experienceController.exportExperiences
);

// Get experience distribution by technology
router.get(
  '/technology-distribution',
  cacheMiddleware(config.cache.experienceApiTtl),
  experienceController.getTechnologyDistribution
);

// Get career timeline data
router.get(
  '/timeline',
  cacheMiddleware(config.cache.experienceApiTtl),
  experienceController.getCareerTimeline
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

// Bulk update experiences
router.patch(
  '/bulk',
  validate(experienceValidator.bulkUpdateExperiences),
  experienceController.bulkUpdateExperiences
);

// Bulk delete experiences
router.delete(
  '/bulk',
  validate(experienceValidator.bulkDeleteExperiences),
  experienceController.bulkDeleteExperiences
);

module.exports = router; 