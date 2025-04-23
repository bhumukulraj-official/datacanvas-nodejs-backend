/**
 * Export testimonial module
 */
const { testimonialRoutes } = require('./routes');
const { TestimonialModel } = require('./models');

module.exports = {
  testimonialRoutes,
  TestimonialModel,
}; 