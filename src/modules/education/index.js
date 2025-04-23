/**
 * Export education module
 */
const { educationRoutes } = require('./routes');
const { Education } = require('./models');

module.exports = {
  educationRoutes,
  EducationModel: Education
}; 