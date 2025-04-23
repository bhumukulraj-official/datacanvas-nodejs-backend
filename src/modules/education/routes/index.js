/**
 * Education Routes
 */
const express = require('express');
const router = express.Router();

const { educationController } = require('../controllers');
const { educationValidator } = require('../validators');
const { authenticate, authorize } = require('../../../shared/middleware');

// Public routes
router.get('/public/history/:userId', educationController.getEducationHistory);
router.get('/public/current/:userId', educationController.getCurrentEducation);

// Protected routes
router.use(authenticate); // Require authentication for all routes below

// Get all education entries (with filtering)
router.get('/', educationController.getAllEducation);

// Get education by ID
router.get('/:id', educationController.getEducationById);

// Create new education entry
router.post('/', 
  educationValidator.validateCreateEducation,
  educationController.createEducation
);

// Update education entry
router.put('/:id', 
  educationValidator.validateUpdateEducation,
  educationController.updateEducation
);

// Delete education entry
router.delete('/:id', educationController.deleteEducation);

// Get current education
router.get('/current', educationController.getCurrentEducation);

// Get education history
router.get('/history', educationController.getEducationHistory);

// Import education entries
router.post('/import', 
  educationValidator.validateImportEducation,
  educationController.importEducation
);

module.exports = router;

/**
 * Export routes
 */
const educationRoutes = require('./education.routes');

module.exports = {
  educationRoutes
}; 