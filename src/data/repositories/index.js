const authRepositories = require('./auth');
const billingRepositories = require('./billing');
const contentRepositories = require('./content');
const messagingRepositories = require('./messaging');
const metricsRepositories = require('./metrics');
const publicRepositories = require('./public');
const publicApiRepositories = require('./public_api');

module.exports = {
  auth: authRepositories,
  billing: billingRepositories,
  content: contentRepositories,
  messaging: messagingRepositories,
  metrics: metricsRepositories,
  public: publicRepositories,
  public_api: publicApiRepositories,
  ...contentRepositories,
}; 