/**
 * Education routes
 */
const express = require('express');
const { educationController } = require('../controllers');
const { auth, validate } = require('../../../middleware');
const { educationValidator } = require('../validators');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth());

// Get all education entries (paginated/sorted)
router.get(
  '/',
  validate(educationValidator.getEducation),
  educationController.getAllEducation
);

// Get education by ID
router.get(
  '/:id',
  validate(educationValidator.getEducationById),
  educationController.getEducationById
);

// Get current education (where is_current is true)
router.get(
  '/current',
  educationController.getCurrentEducation
);

// Get current education for specific user
router.get(
  '/user/:userId/current',
  educationController.getCurrentEducation
);

// Create new education entry
router.post(
  '/',
  validate(educationValidator.createEducation),
  educationController.createEducation
);

// Update education entry
router.patch(
  '/:id',
  validate(educationValidator.updateEducation),
  educationController.updateEducation
);

// Delete education entry
router.delete(
  '/:id',
  validate(educationValidator.deleteEducation),
  educationController.deleteEducation
);

module.exports = router; 