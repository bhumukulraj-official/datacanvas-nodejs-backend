/**
 * Auth module index file
 * Exports auth module components
 */

const authRoutes = require('./routes');
const authControllers = require('./controllers');
const authServices = require('./services');
const authMiddleware = require('./middleware');

module.exports = {
  authRoutes,
  authControllers,
  authServices,
  authMiddleware
}; 