/**
 * Monitoring controller
 * Handles HTTP requests for monitoring operations
 */
const monitoringService = require('../services/monitoring.service');
const { catchAsync } = require('../../../shared/utils/errors');

/**
 * Get metrics in Prometheus format
 * @route GET /api/v1/admin/system/metrics
 */
exports.getMetrics = catchAsync(async (req, res) => {
  const metrics = await monitoringService.getMetrics();
  
  // Set content type for Prometheus
  res.set('Content-Type', 'text/plain; version=0.0.4');
  
  // Send metrics without JSON wrapper
  res.send(metrics);
});

/**
 * Get system status
 * @route GET /api/v1/admin/system/status
 */
exports.getSystemStatus = catchAsync(async (req, res) => {
  // Get system information
  const os = require('os');
  
  const systemInfo = {
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    release: os.release(),
    uptime: formatUptime(os.uptime()),
    loadAvg: os.loadavg(),
    memory: {
      total: formatBytes(os.totalmem()),
      free: formatBytes(os.freemem()),
      usage: Math.round((1 - os.freemem() / os.totalmem()) * 100) + '%'
    },
    cpus: os.cpus().map(cpu => ({
      model: cpu.model,
      speed: cpu.speed + ' MHz'
    })),
    network: getNetworkInterfaces()
  };
  
  // Add Node.js information
  systemInfo.node = {
    version: process.version,
    pid: process.pid,
    memoryUsage: {
      rss: formatBytes(process.memoryUsage().rss),
      heapTotal: formatBytes(process.memoryUsage().heapTotal),
      heapUsed: formatBytes(process.memoryUsage().heapUsed),
      external: formatBytes(process.memoryUsage().external)
    }
  };
  
  res.status(200).json({
    success: true,
    message: 'System status retrieved successfully',
    data: systemInfo
  });
});

/**
 * Format bytes to human-readable format
 * @param {number} bytes - Bytes to format
 * @returns {string} Formatted string
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Format uptime to human-readable format
 * @param {number} uptime - Uptime in seconds
 * @returns {string} Formatted string
 */
const formatUptime = (uptime) => {
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
};

/**
 * Get network interfaces
 * @returns {Object} Network interfaces
 */
const getNetworkInterfaces = () => {
  const interfaces = {};
  const netInterfaces = require('os').networkInterfaces();
  
  for (const [name, nets] of Object.entries(netInterfaces)) {
    interfaces[name] = nets
      .filter(net => !net.internal) // Filter out loopback interfaces
      .map(net => ({
        address: net.address,
        netmask: net.netmask,
        family: net.family,
        mac: net.mac
      }));
  }
  
  return interfaces;
}; 