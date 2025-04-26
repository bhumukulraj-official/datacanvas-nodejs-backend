/**
 * Auth routes index file
 * Exports combined auth routes
 */

const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const sessionRoutes = require('./session.routes');

// Combine routes
router.use('/', authRoutes);
router.use('/sessions', sessionRoutes);

module.exports = router; 