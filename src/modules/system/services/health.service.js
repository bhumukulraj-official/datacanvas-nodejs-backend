/**
 * Health service for checking system status and health
 * Provides basic and detailed system health information
 */
const os = require('os');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const db = require('../../../models');
const logger = require('../../../shared/utils/logger');
const axios = require('axios');

const healthService = {
  /**
   * Get basic health status - for public health endpoint
   */
  getBasicHealth: async () => {
    const dbStatus = await healthService.checkDatabaseConnection();
    
    return {
      status: dbStatus.connected ? 'healthy' : 'unhealthy',
      version: process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Get detailed health status - for admin/monitoring
   */
  getDetailedHealth: async () => {
    // Check all major components
    const [dbStatus, diskSpace, externalServices] = await Promise.all([
      healthService.checkDatabaseConnection(),
      healthService.checkDiskSpace(),
      healthService.checkExternalServices()
    ]);

    // Get system metrics
    const systemMetrics = healthService.getSystemMetrics();
    
    return {
      status: dbStatus.connected && !diskSpace.critical ? 'healthy' : 'unhealthy',
      version: process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: os.uptime(),
      system: systemMetrics,
      database: dbStatus,
      disk: diskSpace,
      externalServices: externalServices,
    };
  },

  /**
   * Get system metrics including memory usage, CPU load, etc.
   */
  getSystemMetrics: () => {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    
    return {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      cpus: {
        count: os.cpus().length,
        model: os.cpus()[0].model,
        speed: os.cpus()[0].speed,
      },
      memory: {
        total: totalMem,
        free: freeMem,
        used: usedMem,
        usedPercentage: Math.round((usedMem / totalMem) * 100),
      },
      loadAverage: os.loadavg(),
    };
  },
  
  /**
   * Check database connection health
   */
  checkDatabaseConnection: async () => {
    try {
      // Ping the database with a simple query
      await db.sequelize.query('SELECT 1+1 AS result');
      
      // Get connection pool information
      const poolInfo = db.sequelize.connectionManager.pool;
      
      return {
        connected: true,
        error: null,
        poolSize: poolInfo ? {
          max: poolInfo.options.max,
          min: poolInfo.options.min,
          idle: poolInfo.options.idle,
          acquire: poolInfo.options.acquire,
          current: poolInfo._acquiringConnections ? poolInfo._acquiringConnections.size : 'unknown'
        } : 'unknown'
      };
    } catch (error) {
      logger.error('Database health check failed', { error: error.message });
      return {
        connected: false,
        error: error.message
      };
    }
  },
  
  /**
   * Check disk space usage
   */
  checkDiskSpace: async () => {
    try {
      // Use df command to check disk space
      const { stdout } = await execPromise('df -h /');
      const lines = stdout.trim().split('\n');
      const diskInfo = lines[1].split(/\s+/);
      
      // Parse disk information
      const size = diskInfo[1];
      const used = diskInfo[2];
      const available = diskInfo[3];
      const usedPercentage = parseInt(diskInfo[4].replace('%', ''));
      
      return {
        size,
        used,
        available,
        usedPercentage,
        critical: usedPercentage > 90 // Mark as critical if more than 90% used
      };
    } catch (error) {
      logger.error('Disk space check failed', { error: error.message });
      return {
        error: error.message,
        critical: false
      };
    }
  },
  
  /**
   * Check external services connectivity
   */
  checkExternalServices: async () => {
    const services = [
      // Add external services URLs from configuration
      // Example: { name: 'payment-gateway', url: process.env.PAYMENT_GATEWAY_URL }
    ];
    
    // If no external services configured, return empty results
    if (services.length === 0) {
      return [];
    }
    
    // Check each service
    const results = await Promise.all(services.map(async (service) => {
      try {
        const startTime = Date.now();
        const response = await axios.get(service.url, { 
          timeout: 5000,
          validateStatus: () => true // Don't throw on any status code
        });
        const endTime = Date.now();
        
        return {
          name: service.name,
          status: response.status >= 200 && response.status < 300 ? 'healthy' : 'unhealthy',
          responseTime: endTime - startTime,
          statusCode: response.status
        };
      } catch (error) {
        return {
          name: service.name,
          status: 'unhealthy',
          error: error.message
        };
      }
    }));
    
    return results;
  }
};

module.exports = healthService; 