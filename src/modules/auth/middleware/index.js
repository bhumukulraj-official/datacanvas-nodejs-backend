/**
 * Auth middleware index file
 * Exports all auth middleware
 */

const authMiddleware = require('./auth.middleware');

module.exports = {
  ...authMiddleware
}; 