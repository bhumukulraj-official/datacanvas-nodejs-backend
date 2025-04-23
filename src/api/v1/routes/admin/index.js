const express = require('express');
const router = express.Router();

// Import admin route modules
const projectRoutes = require('../../../../modules/projects/routes/admin');
const blogRoutes = require('../../../../modules/blog/routes/admin');
const contactRoutes = require('../../../../modules/contact/routes/admin');
const skillRoutes = require('./skills');
const experienceRoutes = require('./experience');
const educationRoutes = require('./education');
const settingsRoutes = require('./settings');
const userRoutes = require('./users');
const systemModule = require('../../../../modules/system');
// Import other admin route modules as needed

// Register admin routes
router.use('/projects', projectRoutes);
router.use('/blog', blogRoutes);
router.use('/contact', contactRoutes);
router.use('/skills', skillRoutes);
router.use('/experience', experienceRoutes);
router.use('/education', educationRoutes);
router.use('/settings', settingsRoutes);
router.use('/users', userRoutes);
router.use('/system/backup', systemModule.backupRoutes);
router.use('/system/audit', systemModule.auditRoutes);

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