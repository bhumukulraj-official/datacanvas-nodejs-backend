/**
 * API v1 Routes
 * 
 * This file organizes and exports all routes for the v1 API.
 * Each route is mounted on its own path and includes appropriate versioning information.
 */
const express = require('express');
const router = express.Router();

// Import route modules
const { authRoutes } = require('../../../modules/auth');
const { profileRoutes } = require('../../../modules/profile');
const { projectRoutes } = require('../../../modules/projects');
const { blogRoutes } = require('../../../modules/blog');
const { contactRoutes } = require('../../../modules/contact');
const { mediaRoutes, optimizationRoutes } = require('../../../modules/media');
const { notificationRoutes } = require('../../../modules/notifications');
const { skillRoutes } = require('../../../modules/skills');
const { experienceRoutes } = require('../../../modules/experience');
const { educationRoutes } = require('../../../modules/education');
const { adminRoutes } = require('./admin');
const { testimonialRoutes } = require('../../../modules/testimonials');
const { settingsRoutes } = require('../../../modules/settings');
const { searchRoutes } = require('../../../modules/search');
const { apiKeyRoutes } = require('../../../modules/security');
// Import system health service
const healthService = require('../../../modules/system/services/health.service');
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
  
  res.setHeader('X-API-Version', API_VERSION);
  next();
});

// Register routes
router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/projects', projectRoutes);
router.use('/blog', blogRoutes);
router.use('/contact', contactRoutes);
router.use('/media', mediaRoutes);
router.use('/media/optimize', optimizationRoutes);
router.use('/notifications', notificationRoutes);
router.use('/skills', skillRoutes);
router.use('/experience', experienceRoutes);
router.use('/education', educationRoutes);
router.use('/admin', adminRoutes);
router.use('/testimonials', testimonialRoutes);
router.use('/settings', settingsRoutes);
router.use('/search', searchRoutes);
router.use('/api-keys', apiKeyRoutes);
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
        { path: '/contact', description: 'Contact form submission' },
        { path: '/media', description: 'Media management and optimization' },
        { path: '/notifications', description: 'Notification management' },
        { path: '/skills', description: 'Skills management' },
        { path: '/experience', description: 'Work experience management' },
        { path: '/education', description: 'Education history management' },
        { path: '/admin', description: 'Admin operations' },
        { path: '/admin/users', description: 'User management (admin only)' },
        { path: '/testimonials', description: 'Testimonial management' },
        { path: '/settings', description: 'Site settings configuration' },
        { path: '/search', description: 'Global search functionality' },
        { path: '/api-keys', description: 'API key management' }
      ]
    }
  });
});

// API Health check - Basic health endpoint
router.get('/health', async (req, res) => {
  const basicHealth = await healthService.getBasicHealth();
  
  res.status(200).json({
    success: true,
    data: {
      ...basicHealth,
      version: API_VERSION
    }
  });
});

// API Detailed Health check - Detailed health information
router.get('/health/detailed', async (req, res) => {
  const detailedHealth = await healthService.getDetailedHealth();
  
  res.status(200).json({
    success: true,
    data: {
      ...detailedHealth,
      version: API_VERSION
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