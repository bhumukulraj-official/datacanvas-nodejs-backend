const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('../../../modules/auth/routes/auth.routes');
const profileRoutes = require('../../../modules/profile/routes');
const projectRoutes = require('../../../modules/projects/routes');
// Import other route modules as needed

// Register routes
router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/projects', projectRoutes);
// Register other routes as needed

// API Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Admin project routes
// The same controller is used but with authentication
router.use('/admin/projects', projectRoutes);

// Catch-all route for undefined endpoints
router.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_002',
      message: `Can't find ${req.originalUrl} on this server!`,
      timestamp: new Date().toISOString()
    }
  });
});

module.exports = router;