const express = require('express');
const router = express.Router();

// Import admin route modules
const projectRoutes = require('../../../../modules/projects/routes/admin');
const blogRoutes = require('../../../../modules/blog/routes/admin');
// Import other admin route modules as needed

// Register admin routes
router.use('/projects', projectRoutes);
router.use('/blog', blogRoutes);

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