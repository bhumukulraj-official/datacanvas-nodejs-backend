/**
 * API v1 Routes
 * 
 * This file organizes and exports all routes for the v1 API.
 * Each route is mounted on its own path and includes appropriate versioning information.
 */
const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('../../../modules/auth/routes/auth.routes');
const profileRoutes = require('../../../modules/profile/routes');
const projectRoutes = require('../../../modules/projects/routes');
const blogRoutes = require('../../../modules/blog/routes');
const adminRoutes = require('./admin');
// Import other route modules as needed

// API version information
const API_VERSION = 'v1';
const API_RELEASE_DATE = '2023-01-01';
const API_DEPRECATION_DATE = null; // Set when this API version will be deprecated

// Middleware to add version metadata to all v1 responses
router.use((req, res, next) => {
  const originalJson = res.json;
  
  // Override json method to add version information
  res.json = function(obj) {
    // Add version metadata if it's not an error response
    if (obj && !obj.error) {
      obj.metadata = {
        ...obj.metadata,
        apiVersion: API_VERSION,
        releaseDate: API_RELEASE_DATE,
        deprecationDate: API_DEPRECATION_DATE
      };
    }
    
    // Call the original json method
    return originalJson.call(this, obj);
  };
  
  next();
});

// Register routes
router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/projects', projectRoutes);
router.use('/blog', blogRoutes);
router.use('/admin', adminRoutes);
// Register other routes as needed

// API version info endpoint
router.get('/version', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      version: API_VERSION,
      releaseDate: API_RELEASE_DATE,
      deprecationDate: API_DEPRECATION_DATE,
      isDeprecated: !!API_DEPRECATION_DATE && new Date(API_DEPRECATION_DATE) <= new Date(),
      endpoints: [
        { path: '/auth', description: 'Authentication endpoints' },
        { path: '/profile', description: 'User profile management' },
        { path: '/projects', description: 'Project management' },
        { path: '/blog', description: 'Blog post management' },
        { path: '/admin', description: 'Admin operations' }
      ]
    }
  });
});

// API Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      version: API_VERSION,
      timestamp: new Date().toISOString()
    }
  });
});

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