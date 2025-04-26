/**
 * Auth controllers index file
 * Exports all auth controllers
 */

const authController = require('./auth.controller');
const sessionController = require('./session.controller');
const passwordController = require('./password.controller');
const emailController = require('./email.controller');

module.exports = {
  authController,
  sessionController,
  passwordController,
  emailController
}; 