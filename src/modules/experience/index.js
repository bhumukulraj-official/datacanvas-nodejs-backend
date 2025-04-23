/**
 * Export experience module
 */
const { experienceRoutes } = require('./routes');
const { Experience } = require('./models');

module.exports = {
  experienceRoutes,
  ExperienceModel: Experience
}; 