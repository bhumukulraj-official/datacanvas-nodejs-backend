const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const apiKeyRoutes = require('./apiKey.routes');
const invitationRoutes = require('./invitation.routes');

module.exports = (app) => {
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/api-keys', apiKeyRoutes);
  app.use('/api/v1/invitations', invitationRoutes);
}; 