/**
 * Monitoring Service
 * Provides system metrics in Prometheus-compatible format
 */
const os = require('os');
const { sequelize } = require('../../../config/database');
const logger = require('../../../shared/utils/logger');
const prom = require('prom-client');

// Create a Registry to register metrics
const register = new prom.Registry();

// Add default metrics (CPU, memory, etc.)
prom.collectDefaultMetrics({ register });

// Custom metrics

// API request counter
const apiRequestCounter = new prom.Counter({
  name: 'api_requests_total',
  help: 'Total number of API requests',
  labelNames: ['method', 'endpoint', 'status_code']
});

// API request duration histogram
const apiRequestDuration = new prom.Histogram({
  name: 'api_request_duration_seconds',
  help: 'API request duration in seconds',
  labelNames: ['method', 'endpoint'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10]
});

// Database query counter
const dbQueryCounter = new prom.Counter({
  name: 'db_queries_total',
  help: 'Total number of database queries',
  labelNames: ['type']
});

// Database query duration histogram
const dbQueryDuration = new prom.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Database query duration in seconds',
  labelNames: ['type'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10]
});

// Active users gauge
const activeUsersGauge = new prom.Gauge({
  name: 'active_users',
  help: 'Number of active users'
});

// API error counter
const apiErrorCounter = new prom.Counter({
  name: 'api_errors_total',
  help: 'Total number of API errors',
  labelNames: ['method', 'endpoint', 'error_code']
});

// Register metrics
register.registerMetric(apiRequestCounter);
register.registerMetric(apiRequestDuration);
register.registerMetric(dbQueryCounter);
register.registerMetric(dbQueryDuration);
register.registerMetric(activeUsersGauge);
register.registerMetric(apiErrorCounter);

/**
 * Get metrics in Prometheus format
 * @returns {string} Metrics in Prometheus format
 */
exports.getMetrics = async () => {
  try {
    return await register.metrics();
  } catch (error) {
    logger.error(`Failed to get metrics: ${error.message}`);
    throw new Error('Failed to generate metrics');
  }
};

/**
 * Middleware to track API requests
 * @returns {Function} Express middleware
 */
exports.apiMetricsMiddleware = () => {
  return (req, res, next) => {
    // Skip metrics endpoint to avoid circular references
    if (req.path === '/api/v1/admin/system/metrics') {
      return next();
    }
    
    const start = Date.now();
    
    // Store original end method
    const originalEnd = res.end;
    
    // Override end method to capture response data
    res.end = function(chunk, encoding) {
      // Calculate request duration
      const duration = (Date.now() - start) / 1000;
      
      // Normalize path by removing IDs
      const path = req.path.replace(/\/[0-9a-fA-F]{8,}/g, '/:id');
      
      // Increment request counter
      apiRequestCounter.inc({
        method: req.method,
        endpoint: path,
        status_code: res.statusCode
      });
      
      // Record request duration
      apiRequestDuration.observe(
        { method: req.method, endpoint: path },
        duration
      );
      
      // If it's an error response, increment error counter
      if (res.statusCode >= 400) {
        apiErrorCounter.inc({
          method: req.method,
          endpoint: path,
          error_code: res.statusCode
        });
      }
      
      // Call original end method
      return originalEnd.call(this, chunk, encoding);
    };
    
    next();
  };
};

/**
 * Track database query metrics
 * @param {string} type - Query type
 * @param {Function} fn - Database query function
 * @returns {Function} Wrapped function that tracks metrics
 */
exports.trackDbQuery = (type, fn) => {
  return async (...args) => {
    const start = Date.now();
    
    try {
      // Increment query counter
      dbQueryCounter.inc({ type });
      
      // Execute the original function
      return await fn(...args);
    } finally {
      // Calculate query duration
      const duration = (Date.now() - start) / 1000;
      
      // Record query duration
      dbQueryDuration.observe({ type }, duration);
    }
  };
};

/**
 * Set active users count
 * @param {number} count - Active users count
 */
exports.setActiveUsers = (count) => {
  activeUsersGauge.set(count);
};

/**
 * Custom metrics to track application-specific events
 * @param {string} name - Metric name
 * @param {Object} labels - Metric labels
 */
exports.incrementCustomCounter = (name, labels = {}) => {
  try {
    // Check if counter exists
    let counter = register.getSingleMetric(`custom_${name}_total`);
    
    // Create counter if it doesn't exist
    if (!counter) {
      counter = new prom.Counter({
        name: `custom_${name}_total`,
        help: `Custom counter for ${name}`,
        labelNames: Object.keys(labels)
      });
      register.registerMetric(counter);
    }
    
    // Increment counter
    counter.inc(labels);
  } catch (error) {
    logger.error(`Failed to increment custom counter: ${error.message}`);
  }
};

/**
 * Initialize database monitoring
 */
exports.initDatabaseMonitoring = () => {
  try {
    // Create a gauge for database connections
    const dbConnectionsGauge = new prom.Gauge({
      name: 'db_connections',
      help: 'Number of database connections'
    });
    register.registerMetric(dbConnectionsGauge);
    
    // Update metrics every minute
    setInterval(async () => {
      try {
        // Get connection count
        const result = await sequelize.query(
          'SELECT count(*) as count FROM pg_stat_activity WHERE datname = current_database()',
          { type: sequelize.QueryTypes.SELECT }
        );
        
        // Update gauge
        dbConnectionsGauge.set(result[0].count);
      } catch (error) {
        logger.error(`Failed to update database metrics: ${error.message}`);
      }
    }, 60000); // Every minute
  } catch (error) {
    logger.error(`Failed to initialize database monitoring: ${error.message}`);
  }
};

/**
 * Initialize system monitoring
 */
exports.initSystemMonitoring = () => {
  try {
    // Create gauges for system metrics
    const memoryGauge = new prom.Gauge({
      name: 'system_memory_usage_bytes',
      help: 'System memory usage in bytes',
      labelNames: ['type']
    });
    
    const cpuGauge = new prom.Gauge({
      name: 'system_cpu_load',
      help: 'System CPU load',
      labelNames: ['type']
    });
    
    register.registerMetric(memoryGauge);
    register.registerMetric(cpuGauge);
    
    // Update metrics every 15 seconds
    setInterval(() => {
      try {
        // Update memory metrics
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        
        memoryGauge.set({ type: 'total' }, totalMemory);
        memoryGauge.set({ type: 'free' }, freeMemory);
        memoryGauge.set({ type: 'used' }, usedMemory);
        
        // Update CPU metrics
        const loadAvg = os.loadavg();
        
        cpuGauge.set({ type: '1m' }, loadAvg[0]);
        cpuGauge.set({ type: '5m' }, loadAvg[1]);
        cpuGauge.set({ type: '15m' }, loadAvg[2]);
      } catch (error) {
        logger.error(`Failed to update system metrics: ${error.message}`);
      }
    }, 15000); // Every 15 seconds
  } catch (error) {
    logger.error(`Failed to initialize system monitoring: ${error.message}`);
  }
};

// Initialize monitoring
exports.init = () => {
  try {
    exports.initDatabaseMonitoring();
    exports.initSystemMonitoring();
    logger.info('Monitoring service initialized');
  } catch (error) {
    logger.error(`Failed to initialize monitoring: ${error.message}`);
  }
}; 