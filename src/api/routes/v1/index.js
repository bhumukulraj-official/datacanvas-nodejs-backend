const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const apiKeyRoutes = require('./apiKey.routes');
const invitationRoutes = require('./invitation.routes');
const projectRoutes = require('./project.routes');
const profileRoutes = require('./profile.routes');
const fileRoutes = require('./file.routes');
const tagRoutes = require('./tag.routes');
const skillRoutes = require('./skill.routes');
const searchRoutes = require('./search.routes');
const billingRoutes = require('./billing.routes');
const messagingRoutes = require('./messaging.routes');

module.exports = (app) => {
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/api-keys', apiKeyRoutes);
  app.use('/api/v1/invitations', invitationRoutes);
  app.use('/api/v1/projects', projectRoutes);
  app.use('/api/v1/profiles', profileRoutes);
  app.use('/api/v1/files', fileRoutes);
  app.use('/api/v1/tags', tagRoutes);
  app.use('/api/v1/skills', skillRoutes);
  app.use('/api/v1/search', searchRoutes);
  app.use('/api/v1/billing', billingRoutes);
  app.use('/api/v1/messaging', messagingRoutes);
}; 