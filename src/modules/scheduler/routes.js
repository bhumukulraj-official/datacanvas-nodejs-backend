/**
 * Export scheduler routes
 * 
 * Note: The scheduler is primarily a background service module
 * but these routes can be used for management if needed
 */

const express = require('express');
const { registerJob, startJob, stopJob } = require('./index');
const { isAuthenticated, isAdmin } = require('../../shared/middleware/auth');

const router = express.Router();

/**
 * @route GET /api/scheduler/jobs
 * @description Get list of all registered jobs
 * @access Admin only
 */
router.get('/jobs', isAuthenticated, isAdmin, (req, res) => {
  // Implementation would be added when needed
  res.status(200).json({ message: 'Scheduler job management API' });
});

const schedulerRoutes = router;

module.exports = {
  schedulerRoutes
}; 