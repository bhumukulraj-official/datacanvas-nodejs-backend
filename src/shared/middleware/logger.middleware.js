const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Middleware for logging HTTP requests and responses
 * Adds a unique request ID and logs request/response details
 */
const requestLogger = (req, res, next) => {
  // Generate a unique request ID
  const requestId = uuidv4();
  req.id = requestId;
  
  // Add request ID to response headers
  res.setHeader('X-Request-ID', requestId);
  
  // Get IP address, accounting for proxies
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  
  // Create request context for logging
  const requestContext = {
    requestId,
    method: req.method,
    url: req.originalUrl || req.url,
    ip,
    userAgent: req.headers['user-agent'],
    userId: req.user ? req.user.id : 'unauthenticated',
    startTime: new Date().toISOString()
  };
  
  // Log request
  logger.info(`Request received: ${req.method} ${req.originalUrl}`, requestContext);
  
  // Track request timing
  const startHrTime = process.hrtime();
  
  // Override end method to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    // Calculate request duration
    const hrTime = process.hrtime(startHrTime);
    const durationInMs = hrTime[0] * 1000 + hrTime[1] / 1000000;
    
    // Build response context
    const responseContext = {
      ...requestContext,
      statusCode: res.statusCode,
      statusMessage: res.statusMessage,
      responseTime: durationInMs.toFixed(2) + 'ms',
      contentLength: res.getHeader('content-length'),
      endTime: new Date().toISOString()
    };
    
    // Log based on status code
    if (res.statusCode >= 500) {
      logger.error(`Response error: ${res.statusCode} ${req.method} ${req.originalUrl}`, responseContext);
    } else if (res.statusCode >= 400) {
      logger.warn(`Response warning: ${res.statusCode} ${req.method} ${req.originalUrl}`, responseContext);
    } else {
      logger.info(`Response sent: ${res.statusCode} ${req.method} ${req.originalUrl}`, responseContext);
    }
    
    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

module.exports = requestLogger; 