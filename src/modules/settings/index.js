/**
 * Settings Module Index
 * Exports the unified settings module components
 */
const settingsRoutes = require('./routes');
const { settingsController } = require('./controllers');
const { settingsValidator } = require('./validators');
const Setting = require('./models/Setting');

module.exports = {
  routes: settingsRoutes,
  controllers: { settingsController },
  validators: { settingsValidator },
  models: { Setting }
}; 