/**
 * Export media module
 */
const { mediaRoutes, optimizationRoutes } = require('./routes');
const Media = require('./models/Media');

module.exports = {
  mediaRoutes,
  optimizationRoutes,
  MediaModel: Media
}; 