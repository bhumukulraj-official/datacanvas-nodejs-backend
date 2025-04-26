/**
 * Profile module index file
 * Exports profile module components
 */

const profileRoutes = require('./routes');
const profileControllers = require('./controllers');
const profileServices = require('./services');

module.exports = {
  profileRoutes,
  profileControllers,
  profileServices
}; 