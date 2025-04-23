/**
 * Export settings module
 */
const { settingRoutes } = require('./routes');
const Setting = require('./models/Setting');

module.exports = {
  settingsRoutes: settingRoutes,
  SettingModel: Setting
}; 