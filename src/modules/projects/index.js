/**
 * Projects module index file
 * Exports projects module components
 */

const projectRoutes = require('./routes');
const projectControllers = require('./controllers');
const projectServices = require('./services');
// const projectMiddleware = require('./middleware');

module.exports = {
  projectRoutes,
  projectControllers,
  projectServices,
  // projectMiddleware
}; 