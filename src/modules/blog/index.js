/**
 * Blog module index file
 * Exports blog module components
 */

const blogRoutes = require('./routes');
const blogControllers = require('./controllers');
const blogServices = require('./services');

module.exports = {
  blogRoutes,
  blogControllers,
  blogServices
}; 