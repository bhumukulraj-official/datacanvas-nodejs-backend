/**
 * Admin routes index
 */
const express = require('express');
const router = express.Router();
const auth = require('../../../../shared/middleware/auth.middleware');
const systemModule = require('../../../../modules/system');

// All admin routes require authentication
router.use(auth.requireAuth);

// All admin routes require admin role
router.use(auth.requireRole('admin'));

// Import admin routes from modules
const { adminRoutes: blogAdminRoutes } = require('../../../../modules/blog');
const { adminRoutes: projectAdminRoutes } = require('../../../../modules/project');
const { adminRoutes: userAdminRoutes } = require('../../../../modules/users');
const { adminRoutes: skillsAdminRoutes } = require('../../../../modules/skills');
const { adminRoutes: experienceAdminRoutes } = require('../../../../modules/experience');
const { adminRoutes: educationAdminRoutes } = require('../../../../modules/education');
const { adminRoutes: testimonialAdminRoutes } = require('../../../../modules/testimonials');
const { adminRoutes: settingsAdminRoutes } = require('../../../../modules/settings');
const { adminRoutes: apiKeyAdminRoutes } = require('../../../../modules/security');

// Register admin routes
router.use('/blog', blogAdminRoutes);
router.use('/projects', projectAdminRoutes);
router.use('/users', userAdminRoutes);
router.use('/skills', skillsAdminRoutes);
router.use('/experience', experienceAdminRoutes);
router.use('/education', educationAdminRoutes);
router.use('/testimonials', testimonialAdminRoutes);
router.use('/settings', settingsAdminRoutes);
router.use('/api-keys', apiKeyAdminRoutes);

// Register system routes
router.use('/system/backup', systemModule.routes.backupRoutes);
router.use('/system/audit', systemModule.routes.auditRoutes);
router.use('/system/config', systemModule.routes.configRoutes);
router.use('/system/cache', systemModule.routes.cacheRoutes);
router.use('/system/logs', systemModule.routes.logRoutes);
router.use('/system/monitoring', systemModule.routes.monitoringRoutes);

// Admin health check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    scope: 'admin',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

module.exports = router; 