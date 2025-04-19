const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('../../../modules/auth/routes/auth.routes');
// Import other route modules as needed

// Register routes
router.use('/auth', authRoutes);
// Register other routes as needed

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