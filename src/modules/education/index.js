/**
 * Export education module
 */
const { educationRoutes, educationMainRouter } = require('./routes');
const { Education } = require('./models');

module.exports = {
  educationRoutes: educationMainRouter,
  EducationModel: Education
}; 