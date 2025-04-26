/**
 * Project module index file
 * Exports project module components
 */

const projectRoutes = require('./routes');
const projectControllers = require('./controllers');
const projectServices = require('./services');
const projectMiddleware = require('./middleware');

module.exports = {
  projectRoutes,
  projectControllers,
  projectServices,
  projectMiddleware
}; 