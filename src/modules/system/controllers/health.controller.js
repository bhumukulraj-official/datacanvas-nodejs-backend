/**
 * Health Controller
 * Handles health check API endpoints
 */
const healthService = require('../services/health.service');
const catchAsync = require('../../../shared/utils/catchAsync');

/**
 * Get basic system health status
 * Used for public health check endpoint
 */
exports.getBasicHealth = catchAsync(async (req, res) => {
  const health = await healthService.getBasicHealth();
  
  res.status(200).json({
    status: 'success',
    data: {
      health
    }
  });
});

/**
 * Get detailed system health information
 * Used for admin/monitoring dashboard
 * Includes database status, system metrics, disk space, etc.
 */
exports.getDetailedHealth = catchAsync(async (req, res) => {
  const health = await healthService.getDetailedHealth();
  
  // Set appropriate status code based on health status
  const statusCode = health.status === 'healthy' ? 200 : 
                     health.status === 'degraded' ? 200 : 503;
  
  res.status(statusCode).json({
    status: 'success',
    data: {
      health
    }
  });
}); 