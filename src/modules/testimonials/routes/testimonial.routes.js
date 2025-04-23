/**
 * Testimonial routes
 */
const express = require('express');
const { testimonialController } = require('../controllers');
const { auth, validate } = require('../../../middleware');
const { testimonialValidation } = require('../validators');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth());

// Get all testimonials (paginated/filtered)
router.get(
  '/',
  validate(testimonialValidation.getTestimonials),
  testimonialController.getAllTestimonials
);

// Get testimonial by ID
router.get(
  '/:id',
  validate(testimonialValidation.getTestimonialById),
  testimonialController.getTestimonialById
);

// Get featured testimonials
router.get(
  '/featured',
  validate(testimonialValidation.getFeaturedTestimonials),
  testimonialController.getFeaturedTestimonials
);

// Get featured testimonials for a specific user (public route)
router.get(
  '/user/:userId/featured',
  validate(testimonialValidation.getFeaturedTestimonials),
  testimonialController.getFeaturedTestimonials
);

// Create new testimonial
router.post(
  '/',
  validate(testimonialValidation.createTestimonial),
  testimonialController.createTestimonial
);

// Update testimonial
router.patch(
  '/:id',
  validate(testimonialValidation.updateTestimonial),
  testimonialController.updateTestimonial
);

// Delete testimonial
router.delete(
  '/:id',
  validate(testimonialValidation.deleteTestimonial),
  testimonialController.deleteTestimonial
);

// Update testimonial status (admin only)
router.patch(
  '/:id/status',
  validate(testimonialValidation.updateTestimonialStatus),
  testimonialController.updateTestimonialStatus
);

// Update testimonial order
router.post(
  '/order',
  validate(testimonialValidation.updateTestimonialOrder),
  testimonialController.updateTestimonialOrder
);

module.exports = router; 