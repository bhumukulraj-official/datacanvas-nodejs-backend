/**
 * Export all configuration modules
 */

const database = require('./database');
const redis = require('./redis');
const s3 = require('./s3');
const email = require('./email');
const security = require('./security');

module.exports = {
  database,
  redis,
  s3,
  email,
  security,
  
  // Environment
  env: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',
  isProd: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  
  // Server configuration
  server: {
    port: parseInt(process.env.PORT || '8000', 10),
    host: process.env.HOST || '0.0.0.0',
    apiPrefix: process.env.API_PREFIX || '/api/v1',
    baseUrl: process.env.BASE_URL || 'http://localhost:8000',
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableConsole: process.env.LOG_ENABLE_CONSOLE !== 'false',
    enableFile: process.env.LOG_ENABLE_FILE === 'true',
    filePath: process.env.LOG_FILE_PATH || 'logs/app.log',
  },
  
  // Pagination defaults
  pagination: {
    defaultPage: 1,
    defaultLimit: 25,
    maxLimit: 100,
  }
}; 