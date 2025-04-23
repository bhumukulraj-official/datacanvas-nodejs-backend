/**
 * Experience Routes
 */
const express = require('express');
const router = express.Router();

const { experienceController } = require('../controllers');
const { experienceValidator } = require('../validators');
const { authenticate, authorize } = require('../../../shared/middleware');

// Public routes
router.get('/public/work-history/:userId', experienceController.getWorkHistory);
router.get('/public/current/:userId', experienceController.getCurrentExperiences);

// Protected routes
router.use(authenticate); // Require authentication for all routes below

// Get all experiences (with filtering)
router.get('/', experienceController.getAllExperiences);

// Get experience by ID
router.get('/:id', experienceController.getExperienceById);

// Create new experience
router.post('/', 
  experienceValidator.validateCreateExperience,
  experienceController.createExperience
);

// Update experience
router.put('/:id', 
  experienceValidator.validateUpdateExperience,
  experienceController.updateExperience
);

// Delete experience
router.delete('/:id', experienceController.deleteExperience);

// Get current experiences
router.get('/current', experienceController.getCurrentExperiences);

// Get work history
router.get('/work-history', experienceController.getWorkHistory);

// Import experiences
router.post('/import', 
  experienceValidator.validateImportExperiences,
  experienceController.importExperiences
);

module.exports = router;

/**
 * Export routes
 */
const experienceRoutes = require('./experience.routes');

module.exports = {
  experienceRoutes
}; 